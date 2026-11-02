import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks } from "@/db/schema/goals";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const taskId = parseInt(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const [existingTask] = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.id, taskId), eq(goalTasks.userId, user.userId)));

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const serverTodayStr = new Date().toISOString().split("T")[0];

    // Check if client provided local date (e.g. "2026-10-12") to account for timezone differences
    let effectiveTodayStr = serverTodayStr;
    if (body.clientDate && typeof body.clientDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.clientDate)) {
      const clientTime = new Date(body.clientDate).getTime();
      const serverTime = new Date(serverTodayStr).getTime();
      if (Math.abs(clientTime - serverTime) <= 36 * 60 * 60 * 1000) {
        effectiveTodayStr = body.clientDate;
      }
    }

    if (existingTask.date > effectiveTodayStr) {
      return NextResponse.json(
        { error: "Tasks scheduled for future dates are locked until their scheduled date." },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof goalTasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    if (body.completionNotes !== undefined) {
      updateData.completionNotes = body.completionNotes;
    }

    if (body.actualMinutes !== undefined) {
      updateData.actualMinutes = Number(body.actualMinutes);
    }

    const [updatedTask] = await db
      .update(goalTasks)
      .set(updateData)
      .where(eq(goalTasks.id, taskId))
      .returning();

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
