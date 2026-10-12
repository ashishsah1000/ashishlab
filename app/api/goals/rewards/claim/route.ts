import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { rewards, goalTasks, weeklyRewardClaims, goals } from "@/db/schema/goals";
import { eq, and, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek, format } from "date-fns";

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rewardId, notes, weekStart: bodyWeekStart, weekEnd: bodyWeekEnd } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID is required" }, { status: 400 });
    }

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, Number(rewardId)), eq(rewards.userId, user.userId)));

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    if (reward.tier !== "small" && reward.isRedeemed) {
      return NextResponse.json({ error: "This reward has already been achieved and redeemed." }, { status: 400 });
    }

    const now = new Date();
    const mon = startOfWeek(now, { weekStartsOn: 1 });
    const sun = endOfWeek(now, { weekStartsOn: 1 });
    const monStr = bodyWeekStart || format(mon, "yyyy-MM-dd");
    const sunStr = bodyWeekEnd || format(sun, "yyyy-MM-dd");

    // If small reward: check weekly 80% threshold
    if (reward.tier === "small") {
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

      const total = currentWeekTasks.length;
      const completed = currentWeekTasks.filter((t) => t.status === "completed").length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      if (rate < 80) {
        return NextResponse.json(
          { error: `Weekly completion rate is ${Math.round(rate)}%. You need at least 80% to claim small rewards.` },
          { status: 400 }
        );
      }

      // Record weekly claim (weekly rewards can be claimed multiple times)
      await db.insert(weeklyRewardClaims).values({
        userId: user.userId,
        rewardId: reward.id,
        weekStart: monStr,
        completionRate: Math.round(rate),
        notes: notes || "Claimed weekly small reward",
      });

      // Small rewards remain active in the vault for future weeks!
      return NextResponse.json({
        success: true,
        reward,
        message: "🎉 Weekly small reward claimed successfully!",
      });
    }

    // Medium & Large rewards: mark as achieved / redeemed permanently
    const [updatedReward] = await db
      .update(rewards)
      .set({
        isRedeemed: true,
        redeemedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rewards.id, reward.id))
      .returning();

    // If attached to a goal, record completion
    if (reward.associatedGoalId) {
      await db
        .update(goals)
        .set({
          status: "completed",
          completedAt: new Date(),
          mediumRewardUnlocked: true,
          updatedAt: new Date(),
        })
        .where(eq(goals.id, reward.associatedGoalId));
    }

    return NextResponse.json({ success: true, reward: updatedReward });
  } catch (error) {
    console.error("Error claiming reward:", error);
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 });
  }
}
