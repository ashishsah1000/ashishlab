import { db } from "@/db";
import { journals } from "@/db/schema/journals";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "default_unsafe_secret"));
    return true;
  } catch {
    return false;
  }
}

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await db.delete(journals).where(eq(journals.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const { visibility } = await request.json();
    if (!["public", "private", "link_only"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const shareToken = visibility === "link_only" ? crypto.randomUUID() : null;

    const result = await db.update(journals)
      .set({ visibility, shareToken })
      .where(eq(journals.id, id))
      .returning();
      
    return NextResponse.json({ success: true, shareToken: result[0]?.shareToken });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
