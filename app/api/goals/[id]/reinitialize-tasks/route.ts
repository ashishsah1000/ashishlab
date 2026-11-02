import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones, goals } from "@/db/schema/goals";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { generateWeekdayTasksForMilestone } from "@/lib/goals";
import { addMonths, format } from "date-fns";
import bcrypt from "bcryptjs";

/**
 * GET /api/goals/[id]/reinitialize-tasks
 * Returns total task count across all milestones of this goal.
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
  const goalId = parseInt(id);
  if (isNaN(goalId)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  try {
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, user.userId)));

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goalMilestones = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.goalId, goalId), eq(milestones.userId, user.userId)));

    const allTasks = await db
      .select({ id: goalTasks.id, status: goalTasks.status })
      .from(goalTasks)
      .where(and(eq(goalTasks.goalId, goalId), eq(goalTasks.userId, user.userId)));

    return NextResponse.json({
      goalId,
      milestonesCount: goalMilestones.length,
      totalCount: allTasks.length,
      completedCount: allTasks.filter((t) => t.status === "completed").length,
      pendingCount: allTasks.filter((t) => t.status === "pending").length,
    });
  } catch (error) {
    console.error("Error checking goal tasks:", error);
    return NextResponse.json({ error: "Failed to check tasks" }, { status: 500 });
  }
}

/**
 * POST /api/goals/[id]/reinitialize-tasks
 * Shifts the goal start date (createdAt) and deadline from today to start fresh,
 * shifts milestone timestamps, clears all existing tasks, and regenerates fresh tasks.
 * Requires user account password verification.
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
  const goalId = parseInt(id);
  if (isNaN(goalId)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password verification is required." }, { status: 400 });
    }

    // Verify user password from database
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId));

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password. Verification failed." }, { status: 401 });
    }

    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, user.userId)));

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goalMilestones = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.goalId, goalId), eq(milestones.userId, user.userId)));

    if (goalMilestones.length === 0) {
      return NextResponse.json({ error: "No milestones found for this goal" }, { status: 400 });
    }

    const now = new Date();

    // Calculate the new deadline by shifting the duration forward from now
    let newDeadline: Date;
    if (goal.durationMonths && goal.durationMonths > 0) {
      newDeadline = addMonths(now, goal.durationMonths);
    } else {
      const originalDurationMs = Math.max(
        new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime(),
        30 * 24 * 60 * 60 * 1000 // default at least 1 month
      );
      newDeadline = new Date(now.getTime() + originalDurationMs);
    }

    // 1. Shift the Goal's time period to start fresh from now
    await db
      .update(goals)
      .set({
        createdAt: now,
        deadline: newDeadline,
        updatedAt: now,
        status: "active",
        completedAt: null,
      })
      .where(eq(goals.id, goalId));

    // 2. Shift Milestone timestamps to start fresh from now
    await db
      .update(milestones)
      .set({
        createdAt: now,
        updatedAt: now,
        status: "active",
        completedAt: null,
      })
      .where(and(eq(milestones.goalId, goalId), eq(milestones.userId, user.userId)));

    // 3. Delete ALL tasks for this goal
    const deleted = await db
      .delete(goalTasks)
      .where(and(eq(goalTasks.goalId, goalId), eq(goalTasks.userId, user.userId)))
      .returning({ id: goalTasks.id });

    // 4. Regenerate fresh weekday tasks starting from today up to the new shifted deadline
    let totalGenerated = 0;
    for (const milestone of goalMilestones) {
      const count = await generateWeekdayTasksForMilestone({
        milestoneId: milestone.id,
        goalId: goal.id,
        userId: user.userId,
        topic: milestone.topic,
        dailyMinutes: milestone.dailyAllottedMinutes,
        targets: milestone.targets,
        startDate: now,
        endDate: newDeadline,
      });
      totalGenerated += count;
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
      generatedCount: totalGenerated,
      milestonesProcessed: goalMilestones.length,
      newDeadline: newDeadline.toISOString(),
      newStartDate: now.toISOString(),
      message: `Goal timeline shifted to start fresh from today (${format(now, "MMM dd, yyyy")} – ${format(newDeadline, "MMM dd, yyyy")}). Generated ${totalGenerated} fresh weekday tasks across ${goalMilestones.length} milestones.`,
    });
  } catch (error) {
    console.error("Error reinitializing goal tasks:", error);
    return NextResponse.json({ error: "Failed to reinitialize tasks" }, { status: 500 });
  }
}
