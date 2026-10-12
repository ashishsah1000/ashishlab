import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones, goalTasks } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";
import { calculateGoalDetailedAnalytics } from "@/lib/goals";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { goalId } = await request.json();
    if (!goalId) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, Number(goalId)), eq(goals.userId, user.userId)));

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goalMilestones = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.goalId, goal.id), eq(milestones.userId, user.userId)));

    const tasks = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.goalId, goal.id), eq(goalTasks.userId, user.userId)));

    const analytics = calculateGoalDetailedAnalytics(goal, goalMilestones, tasks);

    if (!ai) {
      return NextResponse.json({
        report: `### Performance Summary for "${goal.title}"\n\n- **Overall Completion:** ${analytics.overallCompletionRate}%\n- **Failure Rate:** ${analytics.failureRate}%\n- **Show-up Rate:** ${analytics.showUpRate}%\n\nKeep maintaining weekly consistency above 80% to achieve your milestone outputs on schedule.`,
      });
    }

    const recentNotes = tasks
      .filter((t) => t.status === "completed" && t.completionNotes)
      .slice(-10)
      .map((t) => `- [${t.date}] ${t.title}: "${t.completionNotes}"`)
      .join("\n");

    const prompt = `You are a world-class analytics and performance coach.
Generate a comprehensive, encouraging, and data-driven Strategic Improvement Report for the user's goal:
Goal Title: "${goal.title}"
Description: "${goal.description}"
Deadline: ${goal.deadline}
Reward Category: ${goal.rewardCategory}

Analytics Metrics:
- Total Scheduled Tasks: ${analytics.totalTasks}
- Completed Tasks: ${analytics.completedTasks}
- Past Scheduled Tasks: ${analytics.pastTotal}
- Past Completed: ${analytics.pastCompleted}
- Past Missed: ${analytics.pastMissed}
- Overall Completion Rate: ${analytics.overallCompletionRate}%
- Historical Failure Rate: ${analytics.failureRate}%
- Consistency Show-up Rate: ${analytics.showUpRate}%
- 75% Large Reward Threshold Reached: ${analytics.isEligibleForMediumReward ? "YES" : "NO"}
- Weekday Consistency Breakdown: ${JSON.stringify(analytics.weekdayBreakdown)}

Milestones:
${goalMilestones.map((m) => `- Topic: ${m.topic} (Daily: ${m.dailyAllottedMinutes}m, Status: ${m.status}, Targets: ${m.targets})`).join("\n")}

User's Recent Daily Notes:
${recentNotes || "No notes logged yet."}

Please format the response in clean, beautiful Markdown with:
1. ### 🚀 Velocity & Trajectory Overview (Projected completion vs deadline)
2. ### 🎯 Pattern & Failure Analysis (Analyze weekday drops, failure rates, time bottlenecks)
3. ### ⚡ 3 High-Impact Accelerators (Actionable tactics to finish milestones quicker)
4. ### 🏆 Reward & Milestone Status (Evaluation of unlock status and next target)

Keep it practical, highly motivating, and tailored to the actual data provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ report: response.text });
  } catch (error) {
    console.error("Error generating goal report:", error);
    return NextResponse.json({ error: "Failed to generate goal report" }, { status: 500 });
  }
}
