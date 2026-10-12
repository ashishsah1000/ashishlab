import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { db } from "@/db";
import { goals, milestones, goalTasks } from "@/db/schema/goals";
import { users as usersTable } from "@/db/schema/users";
import { eq, and, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { sendGoalProgressEmail } from "@/lib/mailer";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reportType = (body.reportType as "midweek" | "friday") || "friday";

    // Get user details
    const [userRecord] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.userId));

    const recipientEmail = body.targetEmail || userRecord?.email || process.env.GMAIL_USER || "user@ashishlab.com";

    // Get active goals
    const activeGoals = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, user.userId), eq(goals.status, "active")));

    const now = new Date();
    const mon = startOfWeek(now, { weekStartsOn: 1 });
    const sun = endOfWeek(now, { weekStartsOn: 1 });
    const monStr = format(mon, "yyyy-MM-dd");
    const sunStr = format(sun, "yyyy-MM-dd");

    const currentWeekTasks = await db
      .select()
      .from(goalTasks)
      .where(
        and(
          eq(goalTasks.userId, user.userId),
          gte(goalTasks.date, monStr),
          lte(goalTasks.date, sunStr)
        )
      );

    const totalWeekTasks = currentWeekTasks.length;
    const completedWeekTasks = currentWeekTasks.filter((t) => t.status === "completed").length;
    const weeklyRate = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;
    const isRewardUnlocked = totalWeekTasks > 0 && weeklyRate >= 80;

    const goalsSummary = activeGoals.map((g) => {
      const gTasks = currentWeekTasks.filter((t) => t.goalId === g.id);
      const c = gTasks.filter((t) => t.status === "completed").length;
      return {
        title: g.title,
        completed: c,
        total: gTasks.length,
      };
    });

    let aiAdvice = "Keep focusing on showing up daily. Consistency builds compounding momentum toward your targets!";
    if (ai) {
      try {
        const prompt = `Write a 2-sentence encouraging coach advice for ${user.username} for their ${reportType} progress email. 
Weekly completion rate: ${weeklyRate}%. Reward unlocked: ${isRewardUnlocked ? "YES" : "NO"}. Goals: ${activeGoals.map((g) => g.title).join(", ")}.`;
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        if (res.text) aiAdvice = res.text.trim();
      } catch (e) {
        console.error("AI mail advice error:", e);
      }
    }

    const emailResult = await sendGoalProgressEmail({
      toEmail: recipientEmail,
      userName: user.username,
      reportType,
      weeklyRate,
      totalTasksWeek: totalWeekTasks,
      completedTasksWeek: completedWeekTasks,
      isRewardUnlocked,
      goalsSummary,
      aiAdvice,
    });

    return NextResponse.json({
      success: true,
      result: emailResult,
      weeklyRate,
      isRewardUnlocked,
    });
  } catch (error) {
    console.error("Error sending weekly email:", error);
    return NextResponse.json({ error: "Failed to send weekly progress email" }, { status: 500 });
  }
}
