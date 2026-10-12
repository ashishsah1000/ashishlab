import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { milestones } from "@/db/schema/goals";
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
  const milestoneId = parseInt(id);
  if (isNaN(milestoneId)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: Partial<typeof milestones.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.topic !== undefined) updateData.topic = body.topic;
    if (body.dailyAllottedMinutes !== undefined)
      updateData.dailyAllottedMinutes = Number(body.dailyAllottedMinutes);
    if (body.targets !== undefined) updateData.targets = body.targets;
    if (body.endOutput !== undefined) updateData.endOutput = body.endOutput;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      }
    }

    const [updated] = await db
      .update(milestones)
      .set(updateData)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.userId, user.userId)))
      .returning();

    return NextResponse.json({ milestone: updated });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
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
  const milestoneId = parseInt(id);
  if (isNaN(milestoneId)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  try {
    await db
      .delete(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.userId, user.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
