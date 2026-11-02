import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones, goals } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";
import { generateWeekdayTasksForMilestone } from "@/lib/goals";

/**
 * GET /api/milestones/[id]/reinitialize-tasks
 * Check total task count for this milestone (all time).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const milestoneId = parseInt(id);
  if (isNaN(milestoneId)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  try {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.userId, user.userId)));

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Fetch all tasks for this milestone
    const allTasks = await db
      .select({ id: goalTasks.id, date: goalTasks.date, status: goalTasks.status })
      .from(goalTasks)
      .where(
        and(
          eq(goalTasks.milestoneId, milestoneId),
          eq(goalTasks.userId, user.userId)
        )
      );

    return NextResponse.json({
      milestoneId,
      totalCount: allTasks.length,
      completedCount: allTasks.filter((t) => t.status === "completed").length,
      pendingCount: allTasks.filter((t) => t.status === "pending").length,
    });
  } catch (error) {
    console.error("Error checking tasks:", error);
    return NextResponse.json({ error: "Failed to check tasks" }, { status: 500 });
  }
}

/**
 * POST /api/milestones/[id]/reinitialize-tasks
 * Delete ALL tasks for this milestone (past + future) and regenerate clean weekday tasks from today.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const milestoneId = parseInt(id);
  if (isNaN(milestoneId)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  try {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.userId, user.userId)));

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, milestone.goalId), eq(goals.userId, user.userId)));

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const now = new Date();

    // Reset milestone timestamps to start fresh from now
    await db
      .update(milestones)
      .set({
        createdAt: now,
        updatedAt: now,
        status: "active",
        completedAt: null,
      })
      .where(and(eq(milestones.id, milestoneId), eq(milestones.userId, user.userId)));

    // Delete ALL tasks for this milestone (past and future)
    const deleted = await db
      .delete(goalTasks)
      .where(
        and(
          eq(goalTasks.milestoneId, milestoneId),
          eq(goalTasks.userId, user.userId)
        )
      )
      .returning({ id: goalTasks.id });

    // Generate fresh weekday tasks starting from today up to the goal deadline
    const generatedCount = await generateWeekdayTasksForMilestone({
      milestoneId: milestone.id,
      goalId: milestone.goalId,
      userId: user.userId,
      topic: milestone.topic,
      dailyMinutes: milestone.dailyAllottedMinutes,
      targets: milestone.targets,
      startDate: now,
      endDate: new Date(goal.deadline),
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
      generatedCount,
      message: `Cleared ${deleted.length} tasks (all history) and generated ${generatedCount} fresh weekday tasks from today.`,
    });
  } catch (error) {
    console.error("Error reinitializing tasks:", error);
    return NextResponse.json({ error: "Failed to reinitialize tasks" }, { status: 500 });
  }
}
