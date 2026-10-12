import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones, goalTasks, rewards } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";
import { buildMilestoneWeeklyMatrix, buildMonthGitChart, calculateGoalDetailedAnalytics } from "@/lib/goals";

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

    const tasks = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.goalId, goalId), eq(goalTasks.userId, user.userId)));

    let reward = null;
    if (goal.rewardId) {
      const [r] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, goal.rewardId));
      reward = r || null;
    }

    // Weekly matrix for each milestone
    const milestonesWithWeekly = goalMilestones.map((m) => {
      const weeklyMatrix = buildMilestoneWeeklyMatrix(m.id, tasks, 8);
      const mTasks = tasks.filter((t) => t.milestoneId === m.id);
      const mTotal = mTasks.length;
      const mCompleted = mTasks.filter((t) => t.status === "completed").length;
      return {
        ...m,
        totalTasks: mTotal,
        completedTasks: mCompleted,
        completionRate: mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0,
        weeklyMatrix,
      };
    });

    // Detailed analytics
    const analytics = calculateGoalDetailedAnalytics(goal, goalMilestones, tasks);

    const now = new Date();
    const monthGitChart = buildMonthGitChart(now.getFullYear(), now.getMonth() + 1, tasks);

    return NextResponse.json({
      goal,
      reward,
      milestones: milestonesWithWeekly,
      analytics,
      monthGitChart,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const updateData: Partial<typeof goals.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (body.deadline !== undefined) updateData.deadline = new Date(body.deadline);
    if (body.rewardCategory !== undefined) updateData.rewardCategory = body.rewardCategory;
    if (body.rewardId !== undefined) {
      const newRewardId = body.rewardId ? Number(body.rewardId) : null;
      updateData.rewardId = newRewardId;

      // Clear previous associated goal id on old rewards for this goal
      await db
        .update(rewards)
        .set({ associatedGoalId: null })
        .where(and(eq(rewards.associatedGoalId, goalId), eq(rewards.userId, user.userId)));

      // If new reward attached, set associatedGoalId
      if (newRewardId) {
        await db
          .update(rewards)
          .set({ associatedGoalId: goalId })
          .where(eq(rewards.id, newRewardId));
      }
    }
    if (body.mediumRewardUnlocked !== undefined) updateData.mediumRewardUnlocked = body.mediumRewardUnlocked;

    const [updated] = await db
      .update(goals)
      .set(updateData)
      .where(and(eq(goals.id, goalId), eq(goals.userId, user.userId)))
      .returning();

    return NextResponse.json({ goal: updated });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(
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
    // 1. Unlink any reward referencing this goal
    await db
      .update(rewards)
      .set({ associatedGoalId: null })
      .where(and(eq(rewards.associatedGoalId, goalId), eq(rewards.userId, user.userId)));

    // 2. Delete goal
    await db
      .delete(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, user.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
