import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones } from "@/db/schema/goals";
import { eq, and, gt, asc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/ai";
import { parseTaskPlan } from "@/lib/weeklyPlan";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

/**
 * On-demand (button-triggered) AI suggestion for the next pending session of a milestone,
 * based on the completed task's notes. Never runs automatically.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ai) {
    return NextResponse.json(
      { error: "AI suggestions are unavailable: GEMINI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const [task] = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.id, taskId), eq(goalTasks.userId, user.userId)));

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== "completed") {
      return NextResponse.json({ error: "Complete this task first to get a suggestion for the next one." }, { status: 400 });
    }

    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, task.milestoneId));

    const [nextTask] = await db
      .select()
      .from(goalTasks)
      .where(
        and(
          eq(goalTasks.userId, user.userId),
          eq(goalTasks.milestoneId, task.milestoneId),
          eq(goalTasks.status, "pending"),
          gt(goalTasks.date, task.date)
        )
      )
      .orderBy(asc(goalTasks.date), asc(goalTasks.id))
      .limit(1);

    if (!milestone || !nextTask) {
      return NextResponse.json({ error: "No upcoming pending session for this milestone." }, { status: 404 });
    }

    // A generated weekly plan already holds richer guidance; don't overwrite it
    if (parseTaskPlan(nextTask.aiSuggestion)) {
      return NextResponse.json(
        { error: `Your ${nextTask.date} session already has a plan from the weekly planner.` },
        { status: 409 }
      );
    }

    const prompt = `You are a high-performance goal mentor.
The user completed their task on "${task.date}" for topic "${milestone.topic}".
Targets for this milestone: "${milestone.targets}".
Desired outcome: "${milestone.endOutput}".
User notes on what they accomplished: "${task.completionNotes || "Completed session"}".
Write a punchy, 1-2 sentence actionable suggestion for the next session (${nextTask.date}) to advance the goal as fast as possible, along with words of motivation.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const suggestion = response.text?.trim();
    if (!suggestion) {
      return NextResponse.json({ error: "The AI returned an empty suggestion. Please try again." }, { status: 502 });
    }

    await db
      .update(goalTasks)
      .set({ aiSuggestion: suggestion, updatedAt: new Date() })
      .where(eq(goalTasks.id, nextTask.id));

    return NextResponse.json({ nextTask: { id: nextTask.id, date: nextTask.date, aiSuggestion: suggestion } });
  } catch (error) {
    console.error("Error generating next-session suggestion:", error);
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}
