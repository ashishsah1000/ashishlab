"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, Plus, Sparkles, Gift, Bot, MessageSquare, Lock } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import TaskCompleteModal from "@/components/goals/TaskCompleteModal";
import AiCoachDrawer from "@/components/goals/AiCoachDrawer";
import RewardsStoreModal from "@/components/goals/RewardsStoreModal";

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

export default function WeeklyGoalsPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
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
    fetchMilestonesForWeekend();
  }, [startStr, endStr]);

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleCurrentWeek = () => setCurrentDate(new Date());

  // Weekly Stats Calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const weeklyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isRewardUnlocked = totalTasks > 0 && weeklyRate >= 80;

  const handleOpenTask = (t: TaskItem) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (t.date > todayStr) return; // Future tasks cannot be opened
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

      <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24">
        {/* Navigation & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Link
            href="/goals"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Goals
          </Link>

          {/* Week Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>

            <button
              onClick={handleCurrentWeek}
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-800 transition-colors"
            >
              This Week
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>

            <span className="text-xs font-bold text-gray-700 ml-2">
              {format(weekStart, "MMM dd")} – {format(weekEnd, "MMM dd, yyyy")}
            </span>
          </div>
        </div>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        {/* 80% Weekly Target Celebration / Status Bar */}
        <div
          className={`p-5 rounded-3xl border mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            isRewardUnlocked
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/10"
              : "bg-white text-gray-900 border-gray-200 shadow-xs"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  isRewardUnlocked ? "bg-white text-emerald-800" : "bg-blue-50 text-blue-700"
                }`}
              >
                Weekly Goal Target: 80% Consistency
              </span>
              <span className="text-xs font-semibold opacity-90">
                {completedTasks} of {totalTasks} tasks completed
              </span>
            </div>

            <h3 className="text-xl font-black font-heading tracking-tight">
              {isRewardUnlocked
                ? "🎉 Milestone Achieved! Weekly 80% Threshold Met"
                : `Current Consistency: ${weeklyRate}% (${Math.max(0, 80 - weeklyRate)}% to unlock weekly reward)`}
            </h3>
            <p className={`text-xs ${isRewardUnlocked ? "text-emerald-100" : "text-gray-500"}`}>
              {isRewardUnlocked
                ? "You earned your weekly micro-reward (any item < ₹1,000)! Claim it directly from the rewards store."
                : "Complete at least 80% of daily tasks across your milestones to qualify for this week's Small Reward."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRewardsOpen(true)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                isRewardUnlocked
                  ? "bg-white text-emerald-800 hover:bg-emerald-50"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>{isRewardUnlocked ? "Claim Small Reward" : "Open Rewards Vault"}</span>
            </button>
          </div>
        </div>

        {/* 7-Day Weekly Calendar Columns */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-10">
          {daysOfWeek.map((dayDate, idx) => {
            const dateStr = format(dayDate, "yyyy-MM-dd");
            const dayName = format(dayDate, "EEE");
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const isToday = isSameDay(dayDate, new Date());
            const isFutureDay = dateStr > todayStr;
            const isPastDay = dateStr < todayStr;
            const isWeekendDay = idx === 5 || idx === 6; // Sat, Sun

            const dayTasks = tasks.filter((t) => t.date === dateStr);
            const dayCompleted = dayTasks.filter((t) => t.status === "completed").length;
            const dayPendingMissed = isPastDay ? dayTasks.filter((t) => t.status === "pending").length : 0;
            const dayRate = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
            const isDayGreen = dayTasks.length > 0 && dayRate >= 80;

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-3xl p-3.5 border flex flex-col min-h-[420px] transition-all ${
                  isToday
                    ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md"
                    : isFutureDay
                    ? "bg-gray-50/50 border-gray-100"
                    : isWeekendDay
                    ? "bg-gray-50/70 border-gray-200"
                    : "border-gray-100 shadow-xs"
                }`}
              >
                {/* Column Day Header */}
                <div className="pb-3 border-b border-gray-100 mb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-black uppercase ${
                          isToday
                            ? "text-blue-600"
                            : isFutureDay
                            ? "text-gray-400"
                            : isWeekendDay
                            ? "text-amber-700"
                            : "text-gray-500"
                        }`}
                      >
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                          Today
                        </span>
                      )}
                      {isFutureDay && (
                        <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                      {isPastDay && dayPendingMissed > 0 && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded" title="Missed tasks can be updated or backfilled here">
                          {dayPendingMissed} Missed
                        </span>
                      )}
                    </div>

                    {dayTasks.length > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isDayGreen
                            ? "bg-emerald-100 text-emerald-800"
                            : isFutureDay
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {dayCompleted}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-black font-heading ${isFutureDay ? "text-gray-400" : "text-gray-900"}`}>
                      {format(dayDate, "dd")}
                    </span>
                    <span className="text-[10px] text-gray-400">{format(dayDate, "MMM")}</span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-gray-400">
                      {isWeekendDay ? "Weekend Rest" : "No tasks scheduled"}
                    </div>
                  ) : (
                    dayTasks.map((t) => {
                      const isTaskFuture = t.date > todayStr;

                      if (isTaskFuture) {
                        return (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-2xl border text-xs bg-gray-50/70 border-gray-200/50 text-gray-400 cursor-not-allowed select-none opacity-60 transition-all"
                            title="Locked: Scheduled for future date (cannot open or edit)"
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                disabled
                                className="mt-0.5 shrink-0 text-gray-300 cursor-not-allowed"
                                title="Locked: Scheduled for future date"
                              >
                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-black uppercase block line-clamp-1 text-gray-400">
                                    {t.milestoneTopic || t.goalTitle}
                                  </span>

                                  <span className="text-[9px] font-semibold text-gray-400 bg-gray-200/70 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                    <Lock className="w-2.5 h-2.5" /> Upcoming
                                  </span>
                                </div>

                                <p className="font-medium text-[11px] leading-snug text-gray-500">
                                  {t.title}
                                </p>

                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span>{t.actualMinutes || t.estimatedMinutes}m</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Active task: either today or past missed/completed task
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleOpenTask(t)}
                          className={`p-2.5 rounded-2xl border text-xs transition-all cursor-pointer hover:scale-[1.02] shadow-2xs ${
                            t.status === "completed"
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:border-emerald-400"
                              : isPastDay
                              ? "bg-amber-50/60 border-amber-300 text-gray-900 hover:border-amber-500 shadow-xs"
                              : "bg-white border-blue-200/80 text-gray-900 hover:border-blue-500"
                          }`}
                          title={
                            isPastDay && t.status === "pending"
                              ? "Missed task: Click to log notes/time or click circle to mark complete"
                              : t.status === "completed"
                              ? "Completed: Click to view/edit notes"
                              : "Today's task: Click to view/edit or click circle to mark complete"
                          }
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleQuickToggle(e, t)}
                              className="mt-0.5 shrink-0 transition-colors"
                              title={t.status === "completed" ? "Completed (click to toggle pending)" : "Click to mark complete"}
                            >
                              {t.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 hover:text-emerald-700" />
                              ) : (
                                <Circle className={`w-4 h-4 ${isPastDay ? "text-amber-400 hover:text-emerald-600" : "text-gray-300 hover:text-blue-600"}`} />
                              )}
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[9px] font-black uppercase block line-clamp-1 ${isPastDay && t.status === "pending" ? "text-amber-700" : "text-blue-600"}`}>
                                  {t.milestoneTopic || t.goalTitle}
                                </span>

                                {isPastDay && t.status === "pending" ? (
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300/80 px-1.5 py-0.5 rounded shrink-0">
                                    Missed
                                  </span>
                                ) : isToday && t.status === "pending" ? (
                                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                                    Today
                                  </span>
                                ) : null}
                              </div>

                              <p
                                className={`font-bold text-[11px] leading-snug ${
                                  t.status === "completed"
                                    ? "line-through opacity-70 text-emerald-950"
                                    : "text-gray-900"
                                }`}
                              >
                                {t.title}
                              </p>

                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>{t.actualMinutes || t.estimatedMinutes}m</span>
                                {t.isWeekendBonus && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-bold">
                                    Bonus
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Weekend Add Bonus Button */}
                {isWeekendDay && (
                  <button
                    onClick={() => !isFutureDay && setWeekendModalDate(dateStr)}
                    disabled={isFutureDay}
                    className={`mt-3 w-full py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 shrink-0 ${
                      isFutureDay
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80 cursor-pointer"
                    }`}
                    title={isFutureDay ? `Unlocks on ${format(dayDate, "MMM dd")}` : "Add weekend bonus session"}
                  >
                    {isFutureDay ? (
                      <>
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span>Weekend Locked</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>+ Weekend Session</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Completion & Notes Modal */}
      <TaskCompleteModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={(updated) => {
          setTasks((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
        }}
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
