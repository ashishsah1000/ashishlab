import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalChatMessages, goals, milestones, goalTasks } from "@/db/schema/goals";
import { eq, and, desc, asc } from "drizzle-orm";
import { format } from "date-fns";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/ai";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goalId");

  try {
    const conditions = [eq(goalChatMessages.userId, user.userId)];
    if (goalId) {
      conditions.push(eq(goalChatMessages.goalId, parseInt(goalId)));
    }

    const messages = await db
      .select()
      .from(goalChatMessages)
      .where(and(...conditions))
      .orderBy(asc(goalChatMessages.createdAt))
      .limit(50);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching coach messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, goalId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Save user message to DB
    const [userMsgRecord] = await db
      .insert(goalChatMessages)
      .values({
        userId: user.userId,
        goalId: goalId ? Number(goalId) : null,
        role: "user",
        content: message.trim(),
      })
      .returning();

    // Gather contextual data
    const activeGoals = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, user.userId), eq(goals.status, "active")));

    const userMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.userId, user.userId));

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todaysTasks = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.userId, user.userId), eq(goalTasks.date, todayStr)));

    // Fetch last 10 messages for conversation continuity
    const history = await db
      .select()
      .from(goalChatMessages)
      .where(eq(goalChatMessages.userId, user.userId))
      .orderBy(desc(goalChatMessages.createdAt))
      .limit(10);

    const orderedHistory = history.reverse();

    if (!ai) {
      const fallbackReply = "I am your Goal Coach. Keep pushing on your daily tasks and remember to aim for at least 80% completion this week to unlock your rewards!";
      const [aiMsgRecord] = await db
        .insert(goalChatMessages)
        .values({
          userId: user.userId,
          goalId: goalId ? Number(goalId) : null,
          role: "assistant",
          content: fallbackReply,
        })
        .returning();

      return NextResponse.json({ reply: aiMsgRecord });
    }

    const contextPrompt = `You are an elite, empathetic, and tactical Goal Coach inside Ashish Lab's Goal Monitor.
Your mission:
1. Provide practical, high-clarity answers when the user is confused or blocked.
2. Tell them what concrete step they should take next right now.
3. Keep answers clear, structured (bullet points or numbered steps where appropriate), and motivating without fluff.
4. Reference their actual active goals and milestones when relevant.

User's Active Goals:
${activeGoals.map((g) => `- "${g.title}" (Status: ${g.status}, Deadline: ${g.deadline})`).join("\n") || "No active goals"}

User's Milestones:
${userMilestones.map((m) => `- Topic: ${m.topic} (Daily: ${m.dailyAllottedMinutes}m, Targets: ${m.targets}, Goal: ${m.endOutput})`).join("\n") || "No milestones"}

Today's Tasks (${todayStr}):
${todaysTasks.map((t) => `- "${t.title}" [${t.status}] (${t.estimatedMinutes}m)`).join("\n") || "No tasks today"}

Recent Conversation:
${orderedHistory.map((h) => `${h.role === "user" ? "User" : "Coach"}: ${h.content}`).join("\n")}
User: ${message.trim()}

Respond as the Coach directly:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contextPrompt,
    });

    const replyContent = response.text || "Keep up the momentum and show up for your daily tasks!";

    const [aiMsgRecord] = await db
      .insert(goalChatMessages)
      .values({
        userId: user.userId,
        goalId: goalId ? Number(goalId) : null,
        role: "assistant",
        content: replyContent.trim(),
      })
      .returning();

    return NextResponse.json({ reply: aiMsgRecord });
  } catch (error) {
    console.error("Error in coach chat:", error);
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}
