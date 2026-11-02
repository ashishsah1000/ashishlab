import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goalTasks, milestones, goals } from "@/db/schema/goals";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { format, addDays, parseISO } from "date-fns";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/ai";
import { serializeTaskPlan } from "@/lib/weeklyPlan";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// One Gemini call plans the whole week, which can take longer than a typical request
export const maxDuration = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const truncate = (s: string | null | undefined, n: number) =>
  !s ? "" : s.length > n ? `${s.slice(0, n)}…` : s;

interface AiDayPlan {
  taskId: number;
  title: string;
  focus: string;
  why: string;
  steps: string[];
  deliverable: string;
}

interface AiMilestonePlan {
  milestoneId: number;
  weekTarget: string;
  days: AiDayPlan[];
}

/**
 * Generates a plan for every open (pending, today-or-later) weekday task in the given week.
 * Each task gets a specific title plus a structured suggestion (focus, why, steps, deliverable),
 * built from everything the user has done so far on that milestone.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ai) {
    return NextResponse.json(
      { error: "AI planning is unavailable: GEMINI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const weekStart: string = body.weekStart;
  if (typeof weekStart !== "string" || !DATE_RE.test(weekStart)) {
    return NextResponse.json({ error: "weekStart must be YYYY-MM-DD" }, { status: 400 });
  }
  const weekEnd = format(addDays(parseISO(weekStart), 6), "yyyy-MM-dd");

  // Same client-date tolerance as the task PATCH route, so timezones don't shift "today"
  const serverTodayStr = new Date().toISOString().split("T")[0];
  let todayStr = serverTodayStr;
  if (typeof body.clientDate === "string" && DATE_RE.test(body.clientDate)) {
    const diff = Math.abs(new Date(body.clientDate).getTime() - new Date(serverTodayStr).getTime());
    if (diff <= 36 * 60 * 60 * 1000) todayStr = body.clientDate;
  }

  try {
    const weekTasks = await db
      .select()
      .from(goalTasks)
      .where(
        and(
          eq(goalTasks.userId, user.userId),
          gte(goalTasks.date, weekStart),
          lte(goalTasks.date, weekEnd)
        )
      )
      .orderBy(goalTasks.date, goalTasks.id);

    // Plan every unfinished weekday task, including missed past days (planned as catch-up);
    // completed tasks keep their history
    const plannable = weekTasks.filter((t) => t.status === "pending" && !t.isWeekendBonus);
    if (plannable.length === 0) {
      return NextResponse.json(
        { error: "No pending tasks in this week to plan." },
        { status: 400 }
      );
    }

    const milestoneIds = [...new Set(plannable.map((t) => t.milestoneId))];

    const milestoneRows = await db
      .select({ milestone: milestones, goal: goals })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goalId, goals.id))
      .where(and(eq(milestones.userId, user.userId), inArray(milestones.id, milestoneIds)));

    const allMilestoneTasks = await db
      .select()
      .from(goalTasks)
      .where(and(eq(goalTasks.userId, user.userId), inArray(goalTasks.milestoneId, milestoneIds)))
      .orderBy(goalTasks.date, goalTasks.id);

    const contextBlocks = milestoneRows.map(({ milestone: m, goal: g }) => {
      const mTasks = allMilestoneTasks.filter((t) => t.milestoneId === m.id);
      const past = mTasks.filter((t) => t.date < todayStr);
      const completed = mTasks.filter((t) => t.status === "completed");
      const missed = past.filter((t) => t.status === "pending");
      const minutesInvested = completed.reduce(
        (sum, t) => sum + (t.actualMinutes ?? t.estimatedMinutes),
        0
      );
      const remaining = mTasks.filter((t) => t.status === "pending" && t.date >= todayStr);
      const scheduleEnd = mTasks.length > 0 ? mTasks[mTasks.length - 1].date : "unknown";

      const completionLog =
        completed
          .slice(-15)
          .map(
            (t) =>
              `  - ${t.date}: "${truncate(t.title, 120)}" (${t.actualMinutes ?? t.estimatedMinutes} min)${
                t.completionNotes ? ` — notes: ${truncate(t.completionNotes, 300)}` : ""
              }`
          )
          .join("\n") || "  - (nothing completed yet — this is the start of the milestone)";

      const missedLog =
        missed
          .slice(-5)
          .map((t) => `  - ${t.date}: "${truncate(t.title, 120)}"`)
          .join("\n") || "  - (none)";

      const doneThisWeek =
        weekTasks
          .filter((t) => t.milestoneId === m.id && t.status === "completed")
          .map((t) => `  - ${t.date}: "${truncate(t.title, 120)}"`)
          .join("\n") || "  - (none yet)";

      const slots = plannable
        .filter((t) => t.milestoneId === m.id)
        .map(
          (t) =>
            `  - taskId ${t.id}: ${format(parseISO(t.date), "EEEE")} ${t.date}, ${t.estimatedMinutes} min${
              t.date < todayStr ? " (missed — plan as a catch-up session)" : ""
            }`
        )
        .join("\n");

      return `### Milestone ${m.id}: "${m.topic}"${m.status === "completed" ? " (marked completed)" : ""}
Goal: "${g.title}"${g.description ? ` — ${truncate(g.description, 400)}` : ""}
Goal deadline: ${format(g.deadline, "yyyy-MM-dd")}
Milestone targets: ${m.targets}
Expected end output: ${m.endOutput}
Daily time budget: ${m.dailyAllottedMinutes} min
Progress: ${completed.length} sessions completed, ${missed.length} missed, ${minutesInvested} min invested
Remaining scheduled sessions (including this week): ${remaining.length}, last scheduled day ${scheduleEnd}
Recent completed sessions (oldest → newest):
${completionLog}
Recently missed sessions:
${missedLog}
Already completed this week:
${doneThisWeek}
Open sessions to plan this week:
${slots}`;
    });

    const prompt = `You are an expert learning and productivity coach building a concrete weekly plan.
Today is ${todayStr}. The week runs ${weekStart} to ${weekEnd}.

For each milestone below, study what the user has already achieved (their session notes are the best signal), what is still left to reach the targets and end output, and how many sessions remain before the schedule ends. Then:
1. Set ONE realistic "weekTarget" for this week that moves them measurably toward the end output, sized to the open sessions and their time budget.
2. Break that target into one plan per open session, sequenced so each day builds on the previous one. Do not repeat work they already finished. If they missed sessions recently, fold the most important missed work in rather than ignoring it, and keep each day achievable within its minutes.
3. Sessions marked "missed" are past days the user will catch up on now: plan them as the earliest work in the sequence, so later days build on them.

For every open session return:
- "title": the specific thing to work on that day, max 70 characters, no milestone name prefix (e.g. "Implement binary search + 5 practice problems")
- "focus": one sentence on what to achieve today
- "why": 2-3 sentences explaining why this is the right next step, referencing their actual progress, notes, or gaps
- "steps": 2-4 short, concrete actions that fit the session length
- "deliverable": the tangible output that proves the session is done

${contextBlocks.join("\n\n")}

Respond with STRICT JSON only, no markdown, in exactly this shape:
{
  "milestones": [
    {
      "milestoneId": number,
      "weekTarget": "string",
      "days": [
        { "taskId": number, "title": "string", "focus": "string", "why": "string", "steps": ["string"], "deliverable": "string" }
      ]
    }
  ]
}
Include every open session's taskId exactly once, under its own milestone.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: { milestones?: AiMilestonePlan[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Weekly plan: unparseable AI response", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "The AI returned an unreadable plan. Please try again." },
        { status: 502 }
      );
    }

    // Only accept plans for tasks we offered, under the milestone they belong to
    const plannableById = new Map(plannable.map((t) => [t.id, t]));
    const updates: Array<{ id: number; title: string; aiSuggestion: string }> = [];

    for (const mPlan of parsed.milestones ?? []) {
      const weekTarget = String(mPlan.weekTarget ?? "").trim();
      for (const day of mPlan.days ?? []) {
        const task = plannableById.get(Number(day.taskId));
        if (!task || task.milestoneId !== Number(mPlan.milestoneId)) continue;
        const title = String(day.title ?? "").trim();
        if (!title) continue;

        updates.push({
          id: task.id,
          title: truncate(title, 250),
          aiSuggestion: serializeTaskPlan({
            weekTarget,
            focus: String(day.focus ?? "").trim(),
            why: String(day.why ?? "").trim(),
            steps: Array.isArray(day.steps) ? day.steps.map((s) => String(s).trim()).filter(Boolean) : [],
            deliverable: String(day.deliverable ?? "").trim(),
          }),
        });
        plannableById.delete(task.id); // guard against duplicate taskIds
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "The AI did not return a usable plan. Please try again." },
        { status: 502 }
      );
    }

    await db.transaction(async (tx) => {
      for (const u of updates) {
        await tx
          .update(goalTasks)
          .set({ title: u.title, aiSuggestion: u.aiSuggestion, updatedAt: new Date() })
          .where(and(eq(goalTasks.id, u.id), eq(goalTasks.userId, user.userId)));
      }
    });

    return NextResponse.json({
      planned: updates.length,
      unplanned: plannableById.size,
    });
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    return NextResponse.json({ error: "Failed to generate weekly plan" }, { status: 500 });
  }
}
