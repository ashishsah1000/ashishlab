import { db } from "@/db";
import { journals } from "@/db/schema/journals";
import { desc, eq, ilike, or, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const fetchDrafts = searchParams.get("drafts") === "true";

  try {
    let baseCondition = eq(journals.isDraft, fetchDrafts);

    if (query) {
      const res = await db.select().from(journals).where(
        and(
          baseCondition,
          or(
            ilike(journals.title, `%${query}%`),
            ilike(journals.content, `%${query}%`),
            ilike(journals.tags, `%${query}%`)
          )
        )
      ).orderBy(desc(journals.createdAt));
      return NextResponse.json(res);
    }
    const entries = await db.select().from(journals).where(baseCondition).orderBy(desc(journals.createdAt));
    return NextResponse.json(entries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subHeading, content, imageUrl, tags, password, isFlow, isDraft, flowState } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const result = await db.insert(journals).values({
      title,
      subHeading,
      content,
      imageUrl,
      tags,
      isFlow: isFlow || false,
      isDraft: isDraft || false,
      flowState: flowState || null,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}
