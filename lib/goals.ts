import { format, addDays, isWeekend, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, isBefore, startOfDay } from "date-fns";
import { db } from "@/db";
import { goalTasks, milestones, goals, rewards } from "@/db/schema/goals";
import { eq, and, lte, gte } from "drizzle-orm";

export interface ScheduledTaskInput {
  milestoneId: number;
  goalId: number;
  userId: number;
  topic: string;
  dailyMinutes: number;
  targets: string;
  startDate?: Date;
  endDate: Date;
}

/**
 * Automatically creates daily weekday tasks (Mon-Fri) for a milestone
 * from startDate up to endDate (capped at 90 days initially for speed, extensible).
 */
export async function generateWeekdayTasksForMilestone(input: ScheduledTaskInput) {
  const start = input.startDate || new Date();
  const end = input.endDate;

  // Clamp end date to maximum 90 days from start for initial generation
  const maxDays = 90;
  let curr = startOfDay(start);
  const finish = isBefore(end, addDays(curr, maxDays)) ? end : addDays(curr, maxDays);

  const tasksToInsert: Array<typeof goalTasks.$inferInsert> = [];

  while (!isAfter(curr, finish)) {
    // Exclude Saturday and Sunday
    if (!isWeekend(curr)) {
      const dateStr = format(curr, "yyyy-MM-dd");
      tasksToInsert.push({
        milestoneId: input.milestoneId,
        goalId: input.goalId,
        userId: input.userId,
        title: input.topic,
        date: dateStr,
        status: "pending",
        estimatedMinutes: input.dailyMinutes,
        aiSuggestion: `Focus on target: ${input.targets.split(",")[0]?.trim() || input.topic}`,
        isWeekendBonus: false,
      });
    }
    curr = addDays(curr, 1);
  }

  if (tasksToInsert.length > 0) {
    // Insert in batches of 50 to avoid query limits
    for (let i = 0; i < tasksToInsert.length; i += 50) {
      const batch = tasksToInsert.slice(i, i + 50);
      await db.insert(goalTasks).values(batch);
    }
  }

  return tasksToInsert.length;
}

/**
 * Calculates git-like contribution month data for a goal
 * Green: completed >= 80% of daily tasks across milestones
 * Red: completed < 80% of daily tasks (for past/today days with scheduled tasks)
 * Gray: future days or days without tasks
 */
export function buildMonthGitChart(
  year: number,
  month: number, // 1-indexed (1 = Jan, 12 = Dec)
  tasks: Array<typeof goalTasks.$inferSelect>
) {
  const today = format(new Date(), "yyyy-MM-dd");
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isFuture = dateStr > today;
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const totalCount = dayTasks.length;
    const completedCount = dayTasks.filter((t) => t.status === "completed").length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    let status: "green" | "red" | "gray" | "empty" = "gray";

    if (isFuture) {
      status = "gray";
    } else if (totalCount === 0) {
      status = "empty";
    } else if (completionRate >= 80) {
      status = "green";
    } else {
      status = "red";
    }

    days.push({
      date: dateStr,
      day,
      totalTasks: totalCount,
      completedTasks: completedCount,
      completionRate: Math.round(completionRate),
      status,
      isFuture,
    });
  }

  return days;
}

/**
 * Computes weekly milestone matrix for `/goal/[id]`
 * Red if < 80% completed for milestone tasks in week, Green if >= 80%
 */
export function buildMilestoneWeeklyMatrix(
  milestoneId: number,
  tasks: Array<typeof goalTasks.$inferSelect>,
  weeksCount = 8
) {
  const milestoneTasks = tasks.filter((t) => t.milestoneId === milestoneId);
  const now = new Date();
  const weeks = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const refDate = addDays(now, -i * 7);
    const start = startOfWeek(refDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(refDate, { weekStartsOn: 1 }); // Sunday
    const startStr = format(start, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");

    const weekTasks = milestoneTasks.filter((t) => t.date >= startStr && t.date <= endStr);
    const total = weekTasks.length;
    const completed = weekTasks.filter((t) => t.status === "completed").length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    const isFuture = startStr > format(now, "yyyy-MM-dd");

    let status: "green" | "red" | "gray" = "gray";
    if (!isFuture) {
      if (total === 0) {
        status = "gray";
      } else if (rate >= 80) {
        status = "green";
      } else {
        status = "red";
      }
    }

    weeks.push({
      weekLabel: `Wk of ${format(start, "MMM dd")}`,
      startStr,
      endStr,
      total,
      completed,
      rate: Math.round(rate),
      status,
      isFuture,
    });
  }

  return weeks;
}

/**
 * Goal analytics summary (used for `/overview/goals/[id]`)
 */
export function calculateGoalDetailedAnalytics(
  goal: typeof goals.$inferSelect,
  allMilestones: Array<typeof milestones.$inferSelect>,
  allTasks: Array<typeof goalTasks.$inferSelect>
) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const pastOrTodayTasks = allTasks.filter((t) => t.date <= todayStr);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;

  const pastTotal = pastOrTodayTasks.length;
  const pastCompleted = pastOrTodayTasks.filter((t) => t.status === "completed").length;
  const pastMissed = pastTotal - pastCompleted;

  const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const failureRate = pastTotal > 0 ? Math.round((pastMissed / pastTotal) * 100) : 0;
  const showUpRate = pastTotal > 0 ? Math.round((pastCompleted / pastTotal) * 100) : 0;

  // Medium reward unlocked if goal has large reward and showup rate >= 75%
  const isEligibleForMediumReward = goal.rewardCategory === "large" && showUpRate >= 75;

  // All milestones completed check
  const allMilestonesCompleted =
    allMilestones.length > 0 && allMilestones.every((m) => m.status === "completed");

  // Day-of-week breakdown (Mon = 1, Fri = 5)
  const dayStats: Record<string, { total: number; completed: number }> = {
    Mon: { total: 0, completed: 0 },
    Tue: { total: 0, completed: 0 },
    Wed: { total: 0, completed: 0 },
    Thu: { total: 0, completed: 0 },
    Fri: { total: 0, completed: 0 },
    Sat: { total: 0, completed: 0 },
    Sun: { total: 0, completed: 0 },
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (const t of pastOrTodayTasks) {
    const dayIdx = parseISO(t.date).getDay();
    const dName = dayNames[dayIdx];
    if (dayStats[dName]) {
      dayStats[dName].total++;
      if (t.status === "completed") {
        dayStats[dName].completed++;
      }
    }
  }

  const weekdayBreakdown = Object.entries(dayStats).map(([day, stat]) => ({
    day,
    total: stat.total,
    completed: stat.completed,
    rate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
  }));

  return {
    totalTasks,
    completedTasks,
    pastTotal,
    pastCompleted,
    pastMissed,
    overallCompletionRate,
    failureRate,
    showUpRate,
    isEligibleForMediumReward,
    allMilestonesCompleted,
    weekdayBreakdown,
  };
}
