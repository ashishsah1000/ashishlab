import { db } from "@/db";
import { labnotes } from "@/db/schema/labnotes";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id, 10);
    
    if (isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const notes = await db.select().from(labnotes).where(eq(labnotes.id, noteId));
    
    if (notes.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(notes[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lab note" }, { status: 500 });
  }
}
