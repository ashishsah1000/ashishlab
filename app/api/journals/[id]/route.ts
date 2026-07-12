import { db } from "@/db";
import { journals } from "@/db/schema/journals";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const journalId = parseInt(id, 10);
    
    if (isNaN(journalId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const entries = await db.select().from(journals).where(eq(journals.id, journalId));
    
    if (entries.length === 0) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    return NextResponse.json(entries[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 });
  }
}
