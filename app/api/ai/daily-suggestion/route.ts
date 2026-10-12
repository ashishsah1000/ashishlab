import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones, goalTasks } from "@/db/schema/goals";
import { eq, and, desc } from "drizzle-orm";
import { format } from "date-fns";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Fetch active goals
    const activeGoals = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, user.userId), eq(goals.status, "active")));

    // Fetch today's tasks
    const todaysTasks = await db
      .select({
        id: goalTasks.id,
        title: goalTasks.title,
        status: goalTasks.status,
        estimatedMinutes: goalTasks.estimatedMinutes,
        milestoneTopic: milestones.topic,
        targets: milestones.targets,
        goalTitle: goals.title,
      })
      .from(goalTasks)
      .leftJoin(milestones, eq(goalTasks.milestoneId, milestones.id))
      .leftJoin(goals, eq(goalTasks.goalId, goals.id))
      .where(and(eq(goalTasks.userId, user.userId), eq(goalTasks.date, todayStr)));

    // Fetch recently completed tasks (past 3 days)
    const recentTasks = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.userId, user.userId), eq(goalTasks.status, "completed")))
      .orderBy(desc(goalTasks.completedAt))
      .limit(5);

    if (activeGoals.length === 0) {
      return NextResponse.json({
        summary: "You don't have any active goals yet.",
        advice: "Create your first goal to unlock structured milestone tracking and weekly rewards!",
        todayPendingCount: 0,
        focusTask: null,
      });
    }

    const pendingToday = todaysTasks.filter((t) => t.status === "pending");
    const completedToday = todaysTasks.filter((t) => t.status === "completed");

    if (!ai) {
      return NextResponse.json({
        summary: `You have ${activeGoals.length} active goal(s). Today: ${completedToday.length}/${todaysTasks.length} tasks completed.`,
        advice: pendingToday.length > 0 
          ? `Focus on completing "${pendingToday[0].title}" to keep your 80% weekly consistency on track.`
          : "All tasks completed for today! Great dedication.",
        todayPendingCount: pendingToday.length,
        focusTask: pendingToday[0] || null,
      });
    }

    const prompt = `You are an elite productivity and habit coach.
Analyze the user's current progress:
Active Goals: ${activeGoals.map((g) => `"${g.title}" (deadline: ${g.deadline})`).join(", ")}
Today's Date: ${todayStr}
Today's Scheduled Tasks: ${todaysTasks.map((t) => `${t.title} [${t.status}] (${t.estimatedMinutes} mins) - Topic: ${t.milestoneTopic}`).join("; ") || "None"}
Recently Completed Tasks Notes: ${recentTasks.map((t) => `"${t.title}: ${t.completionNotes || "Done"}"`).join("; ") || "None"}

Respond with STRICT JSON format without markdown code blocks:
{
  "summary": "1 concise sentence summarizing today's situation and streak",
  "advice": "1 practical sentence giving clear advice on what to prioritize or how to overcome inertia today",
  "priorityFocus": "Short title of the task to focus on right now"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(rawText);
      return NextResponse.json({
        summary: parsed.summary,
        advice: parsed.advice,
        todayPendingCount: pendingToday.length,
        focusTask: pendingToday[0] || null,
        priorityFocus: parsed.priorityFocus,
      });
    } catch {
      return NextResponse.json({
        summary: `Active goals: ${activeGoals.length}. Today: ${completedToday.length}/${todaysTasks.length} tasks completed.`,
        advice: rawText.slice(0, 150),
        todayPendingCount: pendingToday.length,
        focusTask: pendingToday[0] || null,
      });
    }
  } catch (error) {
    console.error("Error generating daily suggestion:", error);
    return NextResponse.json({
      summary: "Stay consistent today!",
      advice: "Complete at least 80% of your daily tasks to stay on track for your weekly reward.",
      todayPendingCount: 0,
      focusTask: null,
    });
  }
}
