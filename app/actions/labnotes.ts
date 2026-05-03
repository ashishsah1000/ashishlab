"use server";

import { db } from "@/db";
import { labnotes } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createLabnote(formData: FormData) {
  const title = formData.get("title") as string;
  const subHeading = formData.get("subHeading") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const tags = formData.get("tags") as string;

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const result = await db.insert(labnotes).values({
    title,
    subHeading,
    content,
    imageUrl,
    tags,
  }).returning();

  revalidatePath("/labnotes");
  return result[0];
}

export async function getLabnotes(query: string = "") {
  if (query) {
    return await db.select().from(labnotes).where(
      or(
        ilike(labnotes.title, `%${query}%`),
        ilike(labnotes.content, `%${query}%`),
        ilike(labnotes.tags, `%${query}%`)
      )
    ).orderBy(desc(labnotes.createdAt));
  }
  return await db.select().from(labnotes).orderBy(desc(labnotes.createdAt));
}

export async function getLabnoteById(id: number) {
  const notes = await db.select().from(labnotes).where(eq(labnotes.id, id));
  return notes[0];
}
