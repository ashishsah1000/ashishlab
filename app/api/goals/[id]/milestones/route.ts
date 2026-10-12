import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";
import { generateWeekdayTasksForMilestone } from "@/lib/goals";

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
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, user.userId)));

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { topic, dailyAllottedMinutes, targets, endOutput } = body;

    if (!topic || !targets) {
      return NextResponse.json({ error: "Topic and targets are required" }, { status: 400 });
    }

    const [newMilestone] = await db
      .insert(milestones)
      .values({
        goalId: goal.id,
        userId: user.userId,
        topic,
        dailyAllottedMinutes: Number(dailyAllottedMinutes || 30),
        targets,
        endOutput: endOutput || "",
        status: "active",
      })
      .returning();

    // Auto-generate weekday daily tasks up to goal deadline
    await generateWeekdayTasksForMilestone({
      milestoneId: newMilestone.id,
      goalId: goal.id,
      userId: user.userId,
      topic: newMilestone.topic,
      dailyMinutes: newMilestone.dailyAllottedMinutes,
      targets: newMilestone.targets,
      endDate: new Date(goal.deadline),
    });

    return NextResponse.json({ milestone: newMilestone }, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
