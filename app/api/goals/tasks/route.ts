import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones, goals } from "@/db/schema/goals";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const goalId = searchParams.get("goalId");

  try {
    const conditions = [eq(goalTasks.userId, user.userId)];

    if (start) {
      conditions.push(gte(goalTasks.date, start));
    }
    if (end) {
      conditions.push(lte(goalTasks.date, end));
    }
    if (goalId) {
      conditions.push(eq(goalTasks.goalId, parseInt(goalId)));
    }

    const tasksList = await db
      .select({
        id: goalTasks.id,
        milestoneId: goalTasks.milestoneId,
        goalId: goalTasks.goalId,
        userId: goalTasks.userId,
        title: goalTasks.title,
        date: goalTasks.date,
        status: goalTasks.status,
        estimatedMinutes: goalTasks.estimatedMinutes,
        actualMinutes: goalTasks.actualMinutes,
        completionNotes: goalTasks.completionNotes,
        aiSuggestion: goalTasks.aiSuggestion,
        isWeekendBonus: goalTasks.isWeekendBonus,
        completedAt: goalTasks.completedAt,
        milestoneTopic: milestones.topic,
        goalTitle: goals.title,
      })
      .from(goalTasks)
      .leftJoin(milestones, eq(goalTasks.milestoneId, milestones.id))
      .leftJoin(goals, eq(goalTasks.goalId, goals.id))
      .where(and(...conditions))
      .orderBy(goalTasks.date, goalTasks.id);

    return NextResponse.json({ tasks: tasksList });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
