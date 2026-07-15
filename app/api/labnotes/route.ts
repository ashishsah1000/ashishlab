import { db } from "@/db";
import { labnotes } from "@/db/schema/labnotes";
import { desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  try {
    if (query) {
      const notes = await db.select().from(labnotes).where(
        or(
          ilike(labnotes.title, `%${query}%`),
          ilike(labnotes.content, `%${query}%`),
          ilike(labnotes.tags, `%${query}%`)
        )
      ).orderBy(desc(labnotes.createdAt));
      return NextResponse.json(notes);
    }
    const notes = await db.select().from(labnotes).orderBy(desc(labnotes.createdAt));
    return NextResponse.json(notes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lab notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subHeading, content, imageUrl, tags, visibility } = body;

    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "default_unsafe_secret"));
    } catch (e) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const result = await db.insert(labnotes).values({
      title,
      subHeading,
      content,
      imageUrl,
      tags,
      visibility: visibility || "public",
      shareToken: visibility === "link_only" ? crypto.randomUUID() : null,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create lab note" }, { status: 500 });
  }
}
