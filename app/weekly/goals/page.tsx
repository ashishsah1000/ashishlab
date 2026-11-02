"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle, CircleDashed, Plus, Sparkles, Gift, Loader2, RefreshCw } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import TaskCompleteModal from "@/components/goals/TaskCompleteModal";
import AiCoachDrawer from "@/components/goals/AiCoachDrawer";
import RewardsStoreModal from "@/components/goals/RewardsStoreModal";
import { parseTaskPlan } from "@/lib/weeklyPlan";

interface TaskItem {
  id: number;
  milestoneId: number;
  goalId: number;
  userId: number;
  title: string;
  date: string;
  status: "pending" | "completed" | "skipped";
  estimatedMinutes: number;
  actualMinutes: number | null;
  completionNotes: string | null;
  aiSuggestion: string | null;
  isWeekendBonus: boolean;
  milestoneTopic?: string;
  goalTitle?: string;
}

// Stable per-week colour for each milestone (dot on task cards and in the plan list)
const MILESTONE_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

// Day status colour: green at >= 80%, amber if anything was missed, blue if tasks are scheduled
function dayStatusDot(stats: { dayTasks: TaskItem[]; dayPendingMissed: number; isDayGreen: boolean }) {
  if (stats.isDayGreen) return "bg-emerald-500";
  if (stats.dayPendingMissed > 0) return "bg-amber-500";
  if (stats.dayTasks.length > 0) return "bg-blue-400";
  return "bg-transparent";
}

function WeekTaskCard({
  task: t,
  todayStr,
  dotClass,
  focusVisibility,
  onOpen,
  onToggle,
}: {
  task: TaskItem;
  todayStr: string;
  dotClass: string;
  focusVisibility: string;
  onOpen: () => void;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const isFuture = t.date > todayStr;
  const isCompleted = t.status === "completed";
  const isMissed = !isCompleted && t.date < todayStr;
  const focus = !isCompleted ? parseTaskPlan(t.aiSuggestion)?.focus : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      title={isFuture ? "Preview plan (editable on the day)" : isMissed ? "Missed: open to catch up" : undefined}
      className={`rounded-xl border px-3 py-2.5 md:px-2.5 md:py-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        isCompleted
          ? "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
          : isMissed
          ? "bg-amber-50/60 border-amber-200/80 hover:border-amber-300"
          : isFuture
          ? "bg-white/60 border-dashed border-gray-200 hover:border-gray-300"
          : "bg-white border-gray-200 shadow-2xs hover:border-blue-300"
      }`}
    >
      <div className="flex items-start gap-2">
        {isFuture ? (
          <CircleDashed className="w-5 h-5 md:w-4 md:h-4 mt-px shrink-0 text-gray-300" />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 p-1 -m-1 md:p-0 md:m-0 mt-px"
            aria-label={isCompleted ? "Mark as pending" : "Mark as complete"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4 text-emerald-500" />
            ) : (
              <Circle
                className={`w-5 h-5 md:w-4 md:h-4 ${
                  isMissed ? "text-amber-500 hover:text-emerald-600" : "text-gray-300 hover:text-blue-600"
                }`}
              />
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm md:text-xs leading-snug line-clamp-2 ${
              isCompleted
                ? "text-gray-400 line-through"
                : isFuture
                ? "text-gray-500 font-medium"
                : "text-gray-900 font-semibold"
            }`}
          >
            {t.title}
          </p>

          {focus && (
            <p className={`${focusVisibility} mt-1.5 text-xs md:text-[11px] leading-snug text-gray-600 line-clamp-3`}>
              {focus}
            </p>
          )}

          <div className="mt-1 flex items-center gap-1.5 text-[11px] md:text-[10px] text-gray-400 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
            <span className="truncate">{t.milestoneTopic || t.goalTitle}</span>
            <span className="shrink-0">· {t.actualMinutes || t.estimatedMinutes}m</span>
            {t.isWeekendBonus && <span className="shrink-0 text-amber-600 font-semibold">· Bonus</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyGoalsPage() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [uncompletedPastTasks, setUncompletedPastTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  // Weekend bonus state
  const [weekendMilestones, setWeekendMilestones] = useState<Array<{ id: number; topic: string }>>([]);
  const [weekendModalDate, setWeekendModalDate] = useState<string | null>(null);
  const [weekendSelectedMilestone, setWeekendSelectedMilestone] = useState<number | "">("");
  const [weekendMinutes, setWeekendMinutes] = useState(60);
  const [weekendNotes, setWeekendNotes] = useState("");
  const [addingWeekend, setAddingWeekend] = useState(false);

  // AI weekly plan state
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/tasks?start=${startStr}&end=${endStr}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUncompletedPastTasks = async () => {
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/goals/tasks?end=${todayStr}&status=pending`);
      if (res.ok) {
        const data = await res.json();
        setUncompletedPastTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMilestonesForWeekend = async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json();
        const mList: Array<{ id: number; topic: string }> = [];
        for (const g of data.goals || []) {
          const gRes = await fetch(`/api/goals/${g.id}`);
          if (gRes.ok) {
            const gData = await gRes.json();
            for (const m of gData.milestones || []) {
              mList.push({ id: m.id, topic: `${m.topic} (${g.title})` });
            }
          }
        }
        setWeekendMilestones(mList);
        if (mList.length > 0) setWeekendSelectedMilestone(mList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUncompletedPastTasks();
    fetchMilestonesForWeekend();
  }, [startStr, endStr]);

  const changeWeek = (date: Date) => {
    setPlanError(null);
    setCurrentDate(date);
  };
  const handlePrevWeek = () => changeWeek(addDays(currentDate, -7));
  const handleNextWeek = () => changeWeek(addDays(currentDate, 7));
  const handleCurrentWeek = () => changeWeek(new Date());
  // Mobile day view: currentDate is the selected day; stepping past Mon/Sun moves the week too
  const handlePrevDay = () => changeWeek(addDays(currentDate, -1));
  const handleNextDay = () => changeWeek(addDays(currentDate, 1));

  const getDayStats = (dayDate: Date) => {
    const dateStr = format(dayDate, "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const dayCompleted = dayTasks.filter((t) => t.status === "completed").length;
    const dayRate = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
    return {
      dateStr,
      dayTasks,
      dayCompleted,
      dayPendingMissed: dateStr < todayStr ? dayTasks.filter((t) => t.status === "pending").length : 0,
      isDayGreen: dayTasks.length > 0 && dayRate >= 80,
    };
  };

  // Weekly Stats Calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const weeklyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isRewardUnlocked = totalTasks > 0 && weeklyRate >= 80;

  // Weekly plan: unfinished tasks the AI can (re)plan (incl. missed past days), and per-milestone weekly targets
  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  const plannableCount = tasks.filter((t) => t.status === "pending" && !t.isWeekendBonus).length;
  const milestonePlans = Object.values(
    tasks.reduce<Record<number, { milestoneId: number; topic: string; weekTarget: string | null; total: number; completed: number }>>(
      (acc, t) => {
        const entry = (acc[t.milestoneId] ??= {
          milestoneId: t.milestoneId,
          topic: t.milestoneTopic || t.goalTitle || "Milestone",
          weekTarget: null,
          total: 0,
          completed: 0,
        });
        entry.total++;
        if (t.status === "completed") entry.completed++;
        entry.weekTarget ??= parseTaskPlan(t.aiSuggestion)?.weekTarget || null;
        return acc;
      },
      {}
    )
  );
  const hasPlan = milestonePlans.some((m) => m.weekTarget);
  const milestoneColor = (milestoneId: number) =>
    MILESTONE_COLORS[Math.max(0, milestonePlans.findIndex((m) => m.milestoneId === milestoneId)) % MILESTONE_COLORS.length];
  const tasksToUnlock = Math.max(0, Math.ceil(totalTasks * 0.8) - completedTasks);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/goals/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: startStr, clientDate: todayDateStr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPlanError(data.error || "Failed to generate weekly plan");
        return;
      }
      await fetchTasks();
    } catch (e) {
      console.error(e);
      setPlanError("Failed to generate weekly plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleOpenTask = (t: TaskItem) => {
    // Future tasks open read-only so their AI plan can be reviewed ahead of time
    setSelectedTask(t);
    setIsTaskModalOpen(true);
  };

  const handleQuickToggle = async (e: React.MouseEvent, t: TaskItem) => {
    e.stopPropagation();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (t.date > todayStr) return; // Future tasks cannot be toggled

    const nextStatus = t.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/goals/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, clientDate: todayStr }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((item) => (item.id === t.id ? { ...item, ...data.task } : item)));
        fetchUncompletedPastTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWeekendTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekendModalDate || !weekendSelectedMilestone) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (weekendModalDate > todayStr) return; // Future weekend cannot be added
    setAddingWeekend(true);
    try {
      const res = await fetch("/api/goals/tasks/weekend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: Number(weekendSelectedMilestone),
          date: weekendModalDate,
          estimatedMinutes: weekendMinutes,
          notes: weekendNotes,
          clientDate: todayStr,
        }),
      });
      if (res.ok) {
        setWeekendModalDate(null);
        setWeekendNotes("");
        await fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingWeekend(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 w-[92%] md:w-[90%] max-w-[1600px] mx-auto pt-28 md:pt-32 pb-24 flex flex-col">
        {/* Navigation & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Link
            href="/goals"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Goals
          </Link>

          {/* Week Switcher */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-2xs"
              title="Previous Week (Editable)"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>

            {(() => {
              const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
              const isViewingCurrentWeek = isSameDay(weekStart, currentWeekStart);
              const isViewingPastWeek = weekStart < currentWeekStart;

              return (
                <>
                  <button
                    onClick={handleCurrentWeek}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isViewingCurrentWeek
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    This Week
                  </button>

                  <button
                    onClick={handleNextWeek}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-2xs"
                    title="Next Week"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-xs font-bold text-gray-800">
                      {format(weekStart, "MMM dd")} – {format(weekEnd, "MMM dd, yyyy")}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isViewingCurrentWeek
                          ? "bg-blue-100 text-blue-700"
                          : isViewingPastWeek
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isViewingCurrentWeek
                        ? "Active Week"
                        : isViewingPastWeek
                        ? "Past Week (Editable)"
                        : "Upcoming Week"}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        {/* Weekend Catch-Up / Missed Tasks Section */}
        {/* {uncompletedPastTasks.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-3xl p-5 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                    <span>Weekend Catch-Up: {uncompletedPastTasks.length} Uncompleted Task{uncompletedPastTasks.length > 1 ? "s" : ""}</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">
                      From Last Week / Past Days
                    </span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Working on the weekend? Click any missed task to log notes and time spent, or click the circle to mark it done. All past tasks are fully editable!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {uncompletedPastTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenTask(t)}
                  className="p-3 bg-white hover:bg-amber-50/60 border border-amber-200/90 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-2xs hover:scale-[1.01]"
                  title="Click to open details and log weekend output"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => handleQuickToggle(e, t)}
                      className="text-amber-500 hover:text-emerald-600 shrink-0 transition-colors"
                      title="Click to mark complete"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                          {format(parseISO(t.date), "EEE, MMM dd")}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {t.milestoneTopic || t.goalTitle}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                        {t.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                    {t.actualMinutes || t.estimatedMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Week Overview: progress toward the 80% reward + AI weekly plan */}
        {totalTasks > 0 && (
          <div className="mb-6 bg-white border border-gray-200 rounded-3xl p-4 md:p-5 shadow-xs grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {/* Progress */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Week progress</span>
                <button
                  onClick={() => setIsRewardsOpen(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    isRewardUnlocked
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{isRewardUnlocked ? "Claim reward" : "Rewards"}</span>
                </button>
              </div>

              <p className="text-gray-900">
                <span className="text-2xl font-black font-heading">{completedTasks}/{totalTasks}</span>
                <span className="text-sm text-gray-500 ml-1.5">tasks · {weeklyRate}%</span>
              </p>

              <div className="relative h-2 rounded-full bg-gray-100" title="80% of tasks unlocks this week's reward">
                <div
                  className={`h-full rounded-full transition-all ${isRewardUnlocked ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${weeklyRate}%` }}
                />
                <span className="absolute left-[80%] -top-1 h-4 w-0.5 rounded bg-gray-400" />
              </div>

              <p className={`text-xs ${isRewardUnlocked ? "text-emerald-700 font-semibold" : "text-gray-500"}`}>
                {isRewardUnlocked
                  ? "🎉 Weekly reward unlocked"
                  : `${tasksToUnlock} more task${tasksToUnlock === 1 ? "" : "s"} to hit 80% and unlock this week's reward`}
              </p>
            </section>

            {/* AI Weekly Plan */}
            <section className="lg:border-l lg:border-gray-100 lg:pl-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> This week&apos;s plan
                </span>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan || plannableCount === 0}
                  title={
                    plannableCount === 0
                      ? "No pending tasks this week to plan"
                      : hasPlan
                      ? "Regenerate the plan for this week's pending tasks, including missed days (completed tasks are kept)"
                      : "Generate a plan for this week's pending tasks, including missed days"
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasPlan
                      ? "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {generatingPlan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : hasPlan ? (
                    <RefreshCw className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{generatingPlan ? "Planning..." : hasPlan ? "Regenerate" : "Generate plan"}</span>
                </button>
              </div>

              {planError && (
                <p className="mt-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {planError}
                </p>
              )}

              {hasPlan ? (
                <ul className="mt-3 space-y-2.5">
                  {milestonePlans.map((m) => (
                    <li key={m.milestoneId} className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${milestoneColor(m.milestoneId)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">{m.topic}</span>
                          <span className="text-[11px] text-gray-400 shrink-0">
                            {m.completed}/{m.total}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {m.weekTarget || "Not planned yet — regenerate to include this milestone."}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Let AI review what you&apos;ve achieved and what&apos;s left, then set a target for the week and a
                  specific task for each day.
                </p>
              )}
            </section>
          </div>
        )}

        {/* Empty Week Notice */}
        {totalTasks === 0 && (
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-4 md:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-bold text-blue-900 text-sm">No tasks in this week ({format(weekStart, "MMM dd")} – {format(weekEnd, "MMM dd")})</p>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Daily tasks are scheduled for weekdays (Mon–Fri). If you just reinitialized your goal over the weekend, your newly generated tasks begin on Monday.
                </p>
              </div>
            </div>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>View Next Week</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="order-first md:order-none mb-6 md:mb-10">
        {/* Mobile Day Navigator: one day at a time, prev/next or tap a day in the strip */}
        {(() => {
          const sel = getDayStats(currentDate);
          const selIsToday = isSameDay(currentDate, new Date());
          return (
            <div className="md:hidden bg-white border border-gray-200 rounded-3xl p-3 mb-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handlePrevDay}
                  className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 active:bg-gray-100"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="text-center min-w-0">
                  <p className={`text-sm font-black ${selIsToday ? "text-blue-600" : "text-gray-900"}`}>
                    {selIsToday ? "Today" : format(currentDate, "EEEE")}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {format(currentDate, "MMM dd")}
                    {sel.dayTasks.length > 0 && ` · ${sel.dayCompleted}/${sel.dayTasks.length} done`}
                  </p>
                </div>
                <button
                  onClick={handleNextDay}
                  className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 active:bg-gray-100"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mt-3">
                {daysOfWeek.map((dayDate) => {
                  const stats = getDayStats(dayDate);
                  const isSelected = isSameDay(dayDate, currentDate);
                  const isTodayPill = isSameDay(dayDate, new Date());
                  return (
                    <button
                      key={stats.dateStr}
                      onClick={() => setCurrentDate(dayDate)}
                      className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                        isSelected
                          ? "bg-gray-900 text-white"
                          : isTodayPill
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 active:bg-gray-100"
                      }`}
                      aria-label={format(dayDate, "EEEE, MMM dd")}
                    >
                      <span className="text-[10px] font-bold uppercase">{format(dayDate, "EEEEE")}</span>
                      <span className="text-sm font-black">{format(dayDate, "d")}</span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dayStatusDot(stats)}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Weekly Calendar: single selected day on phones, 4 columns on tablets, full week on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-[repeat(5,minmax(0,1fr))_repeat(2,minmax(0,0.8fr))] gap-3">
          {daysOfWeek.map((dayDate, idx) => {
            const stats = getDayStats(dayDate);
            const { dateStr, dayTasks, dayCompleted } = stats;
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const isToday = isSameDay(dayDate, new Date());
            const isFutureDay = dateStr > todayStr;
            const isWeekendDay = idx === 5 || idx === 6; // Sat, Sun
            const isSelectedDay = isSameDay(dayDate, currentDate);
            const dayRate = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
            // AI focus line: today's column on desktop, the selected day on phones
            const focusVisibility = isToday ? "block" : isSelectedDay ? "block md:hidden" : "hidden";

            return (
              <div
                key={dateStr}
                className={`${isSelectedDay ? "flex" : "hidden md:flex"} flex-col rounded-2xl border p-3 md:p-2.5 min-h-[220px] md:min-h-[300px] ${
                  isToday
                    ? "bg-blue-50/40 border-blue-200"
                    : isWeekendDay
                    ? "bg-gray-50/70 border-gray-100"
                    : "bg-white border-gray-100"
                }`}
              >
                {/* Column Day Header (phones use the navigator above) */}
                <div className="hidden md:flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold uppercase ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                      {format(dayDate, "EEE")}
                    </span>
                    <span
                      className={`text-sm font-black ${
                        isToday
                          ? "bg-blue-600 text-white rounded-full w-6 h-6 grid place-items-center"
                          : isFutureDay
                          ? "text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {format(dayDate, "d")}
                    </span>
                  </div>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400">
                      {dayCompleted}/{dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="hidden md:block h-1 rounded-full bg-gray-100 mb-3 overflow-hidden">
                  {!isFutureDay && dayTasks.length > 0 && (
                    <div className={`h-full rounded-full ${dayStatusDot(stats)}`} style={{ width: `${Math.max(dayRate, 4)}%` }} />
                  )}
                </div>

                {/* Tasks List */}
                <div className="flex-1 space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-center py-6 text-xs md:text-[11px] text-gray-300">
                      {isWeekendDay ? "Rest day" : "No tasks"}
                    </p>
                  ) : (
                    dayTasks.map((t) => (
                      <WeekTaskCard
                        key={t.id}
                        task={t}
                        todayStr={todayStr}
                        dotClass={milestoneColor(t.milestoneId)}
                        focusVisibility={focusVisibility}
                        onOpen={() => handleOpenTask(t)}
                        onToggle={(e) => handleQuickToggle(e, t)}
                      />
                    ))
                  )}
                </div>

                {/* Weekend bonus session (only once the day has arrived) */}
                {isWeekendDay && !isFutureDay && (
                  <button
                    onClick={() => setWeekendModalDate(dateStr)}
                    className="mt-2 w-full py-2 md:py-1.5 rounded-xl text-xs md:text-[11px] font-semibold text-gray-500 border border-dashed border-gray-300 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/60 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add session</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Task Completion & Notes Modal */}
      <TaskCompleteModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={(updated) => {
          setTasks((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          fetchUncompletedPastTasks();
        }}
        onNextSuggestion={(id, aiSuggestion) =>
          setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, aiSuggestion } : item)))
        }
      />

      {/* Weekend Bonus Modal */}
      {weekendModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-100 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Add Weekend Study / Workout Session
            </h3>
            <p className="text-xs text-gray-500 mb-4">Date: {weekendModalDate}</p>

            <form onSubmit={handleSaveWeekendTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Select Milestone</label>
                <select
                  value={weekendSelectedMilestone}
                  onChange={(e) => setWeekendSelectedMilestone(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                  required
                >
                  {weekendMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Extra Minutes</label>
                <input
                  type="number"
                  value={weekendMinutes}
                  onChange={(e) => setWeekendMinutes(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Session Target / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Extra 1 hour deep dive into problem sets"
                  value={weekendNotes}
                  onChange={(e) => setWeekendNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-blue-600 bg-gray-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWeekendModalDate(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWeekend}
                  className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50"
                >
                  {addingWeekend ? "Adding..." : "Add Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rewards Store Modal (Weekly Micro-Rewards Store) */}
      <RewardsStoreModal
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        onRewardClaimed={() => fetchTasks()}
        onlyTier="small"
        isUnlocked={isRewardUnlocked}
        weekStart={startStr}
        weekEnd={endStr}
      />

      {/* AI Coach Chat Drawer */}
      <AiCoachDrawer
        isOpen={isCoachOpen}
        onToggle={() => setIsCoachOpen(!isCoachOpen)}
      />
    </main>
  );
}
