import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones, goals } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { milestoneId, date, estimatedMinutes, notes, clientDate } = body;

    if (!milestoneId || !date) {
      return NextResponse.json({ error: "Milestone ID and date are required" }, { status: 400 });
    }

    const serverTodayStr = new Date().toISOString().split("T")[0];
    let effectiveTodayStr = serverTodayStr;
    if (clientDate && typeof clientDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      const clientTime = new Date(clientDate).getTime();
      const serverTime = new Date(serverTodayStr).getTime();
      if (Math.abs(clientTime - serverTime) <= 36 * 60 * 60 * 1000) {
        effectiveTodayStr = clientDate;
      }
    }

    if (date > effectiveTodayStr) {
      return NextResponse.json(
        { error: "Cannot create weekend tasks for future dates." },
        { status: 400 }
      );
    }

    const [milestone] = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, Number(milestoneId)), eq(milestones.userId, user.userId)));

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const [createdTask] = await db
      .insert(goalTasks)
      .values({
        milestoneId: milestone.id,
        goalId: milestone.goalId,
        userId: user.userId,
        title: `${milestone.topic} (Weekend Session)`,
        date,
        status: "pending",
        estimatedMinutes: Number(estimatedMinutes || milestone.dailyAllottedMinutes || 60),
        completionNotes: notes || "",
        isWeekendBonus: true,
        aiSuggestion: "Weekend power session: Deep focus on milestone targets.",
      })
      .returning();

    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating weekend task:", error);
    return NextResponse.json({ error: "Failed to create weekend task" }, { status: 500 });
  }
}
