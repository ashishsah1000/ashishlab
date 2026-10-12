import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { rewards, goalTasks, weeklyRewardClaims, goals } from "@/db/schema/goals";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { startOfWeek, endOfWeek, format } from "date-fns";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRewards = await db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, user.userId))
      .orderBy(desc(rewards.createdAt));

    const userGoals = await db
      .select({ id: goals.id, title: goals.title, rewardId: goals.rewardId })
      .from(goals)
      .where(eq(goals.userId, user.userId));

    const userWeeklyClaims = await db
      .select()
      .from(weeklyRewardClaims)
      .where(eq(weeklyRewardClaims.userId, user.userId));

    const enhancedRewards = userRewards.map((r) => {
      const linkedGoal = userGoals.find((g) => g.rewardId === r.id);
      const isSelected = !!linkedGoal || (r.associatedGoalId ? userGoals.some((g) => g.id === r.associatedGoalId) : false);
      const associatedGoalTitle = linkedGoal ? linkedGoal.title : null;
      const claimsCount = userWeeklyClaims.filter((c) => c.rewardId === r.id).length;

      // Small tier rewards are repeatable weekly awards and never permanently redeemed
      const isRedeemed = r.tier === "small" ? false : r.isRedeemed;

      return {
        ...r,
        isRedeemed,
        isSelected,
        associatedGoalTitle,
        claimsCount,
      };
    });

    // Calculate current week consistency to check 80% small reward unlock
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get("weekStart");
    const weekEndParam = searchParams.get("weekEnd");

    const now = new Date();
    const mon = startOfWeek(now, { weekStartsOn: 1 });
    const sun = endOfWeek(now, { weekStartsOn: 1 });
    const monStr = weekStartParam || format(mon, "yyyy-MM-dd");
    const sunStr = weekEndParam || format(sun, "yyyy-MM-dd");

    const currentWeekTasks = await db
      .select()
      .from(goalTasks)
      .where(
        and(
          eq(goalTasks.userId, user.userId),
          gte(goalTasks.date, monStr),
          lte(goalTasks.date, sunStr)
        )
      );

    const totalWeekTasks = currentWeekTasks.length;
    const completedWeekTasks = currentWeekTasks.filter((t) => t.status === "completed").length;
    const weeklyRate = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;
    const isEligibleForWeeklyReward = totalWeekTasks > 0 && weeklyRate >= 80;

    // Check if user already claimed reward for this week
    const existingClaims = await db
      .select()
      .from(weeklyRewardClaims)
      .where(
        and(
          eq(weeklyRewardClaims.userId, user.userId),
          eq(weeklyRewardClaims.weekStart, monStr)
        )
      );

    const claimedThisWeek = existingClaims.length > 0;

    return NextResponse.json({
      rewards: enhancedRewards,
      weeklyStats: {
        weekStart: monStr,
        weekEnd: sunStr,
        totalTasks: totalWeekTasks,
        completedTasks: completedWeekTasks,
        weeklyRate,
        isEligible: isEligibleForWeeklyReward,
        claimedThisWeek,
      },
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, tier, valueInr, imageUrl, associatedGoalId } = body;

    if (!title || !tier) {
      return NextResponse.json({ error: "Title and tier are required" }, { status: 400 });
    }

    const [newReward] = await db
      .insert(rewards)
      .values({
        userId: user.userId,
        title,
        description: description || "",
        tier,
        valueInr: Number(valueInr || 0),
        imageUrl: imageUrl || null,
        associatedGoalId: associatedGoalId ? Number(associatedGoalId) : null,
        isRedeemed: false,
      })
      .returning();

    return NextResponse.json({ reward: newReward }, { status: 201 });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json({ error: "Failed to create reward" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rewardId = searchParams.get("id");
  if (!rewardId) {
    return NextResponse.json({ error: "Reward ID is required" }, { status: 400 });
  }

  try {
    const id = parseInt(rewardId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid reward ID" }, { status: 400 });
    }

    // 1. Unlink any goals referencing this reward so they show the option to add reward
    await db
      .update(goals)
      .set({ rewardId: null })
      .where(and(eq(goals.rewardId, id), eq(goals.userId, user.userId)));

    // 2. Delete the reward
    await db
      .delete(rewards)
      .where(and(eq(rewards.id, id), eq(rewards.userId, user.userId)));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting reward:", error);
    return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 });
  }
}
