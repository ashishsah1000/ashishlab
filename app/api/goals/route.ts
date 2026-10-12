import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones, goalTasks, rewards } from "@/db/schema/goals";
import { eq, and, desc } from "drizzle-orm";
import { generateWeekdayTasksForMilestone, buildMonthGitChart } from "@/lib/goals";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, user.userId))
      .orderBy(desc(goals.createdAt));

    const userMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.userId, user.userId));

    const userTasks = await db
      .select()
      .from(goalTasks)
      .where(eq(goalTasks.userId, user.userId));

    const userRewards = await db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, user.userId));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Enhance each goal with stats & month git chart
    const enhancedGoals = userGoals.map((g) => {
      const gMilestones = userMilestones.filter((m) => m.goalId === g.id);
      const gTasks = userTasks.filter((t) => t.goalId === g.id);
      const totalTasks = gTasks.length;
      const completedTasks = gTasks.filter((t) => t.status === "completed").length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const reward = userRewards.find((r) => r.id === g.rewardId) || null;
      const monthGitChart = buildMonthGitChart(currentYear, currentMonth, gTasks);

      return {
        ...g,
        milestonesCount: gMilestones.length,
        totalTasks,
        completedTasks,
        completionRate,
        reward,
        monthGitChart,
      };
    });

    return NextResponse.json({ goals: enhancedGoals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      deadline,
      durationMonths,
      rewardCategory,
      rewardId: existingRewardId,
      newReward, // { title, valueInr, description }
      initialMilestones, // Array<{ topic, dailyAllottedMinutes, targets, endOutput }>
    } = body;

    if (!title || !deadline) {
      return NextResponse.json({ error: "Title and deadline are required" }, { status: 400 });
    }

    let finalRewardId = existingRewardId ? Number(existingRewardId) : null;

    // Create reward if requested inline
    if (!finalRewardId && newReward && newReward.title) {
      const [createdReward] = await db
        .insert(rewards)
        .values({
          userId: user.userId,
          title: newReward.title,
          description: newReward.description || "",
          tier: rewardCategory || "medium",
          valueInr: Number(newReward.valueInr || 0),
        })
        .returning();
      finalRewardId = createdReward.id;
    }

    const deadlineDate = new Date(deadline);

    // Create Goal
    const [createdGoal] = await db
      .insert(goals)
      .values({
        userId: user.userId,
        title,
        description: description || "",
        deadline: deadlineDate,
        durationMonths: durationMonths ? Number(durationMonths) : 1,
        status: "active",
        rewardCategory: rewardCategory || "medium",
        rewardId: finalRewardId,
      })
      .returning();

    // If reward was created, associate goal id
    if (finalRewardId) {
      await db
        .update(rewards)
        .set({ associatedGoalId: createdGoal.id })
        .where(eq(rewards.id, finalRewardId));
    }

    // Create Milestones and auto-generate weekday tasks
    if (Array.isArray(initialMilestones) && initialMilestones.length > 0) {
      for (const m of initialMilestones) {
        if (!m.topic || !m.targets) continue;
        const [createdMilestone] = await db
          .insert(milestones)
          .values({
            goalId: createdGoal.id,
            userId: user.userId,
            topic: m.topic,
            dailyAllottedMinutes: Number(m.dailyAllottedMinutes || 30),
            targets: m.targets,
            endOutput: m.endOutput || "",
            status: "active",
          })
          .returning();

        // Auto-generate weekday daily tasks
        await generateWeekdayTasksForMilestone({
          milestoneId: createdMilestone.id,
          goalId: createdGoal.id,
          userId: user.userId,
          topic: createdMilestone.topic,
          dailyMinutes: createdMilestone.dailyAllottedMinutes,
          targets: createdMilestone.targets,
          endDate: deadlineDate,
        });
      }
    }

    return NextResponse.json({ goal: createdGoal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
