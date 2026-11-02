"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, Sparkles, X, FileText, Lock, AlertCircle, Lightbulb, ListChecks, Flag, Target, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { parseTaskPlan } from "@/lib/weeklyPlan";

interface TaskItem {
  id: number;
  title: string;
  date: string;
  status: "pending" | "completed" | "skipped";
  estimatedMinutes: number;
  actualMinutes: number | null;
  completionNotes: string | null;
  aiSuggestion: string | null;
  milestoneTopic?: string;
  goalTitle?: string;
}

interface TaskCompleteModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedTask: TaskItem) => void;
  onNextSuggestion?: (nextTaskId: number, aiSuggestion: string) => void;
}

export default function TaskCompleteModal({ task, isOpen, onClose, onSaved, onNextSuggestion }: TaskCompleteModalProps) {
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [actualMinutes, setActualMinutes] = useState("30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [nextSuggestion, setNextSuggestion] = useState<{ date: string; text: string } | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setStatus(task.status === "completed" ? "completed" : "pending");
      setActualMinutes(String(task.actualMinutes || task.estimatedMinutes || 30));
      setNotes(task.completionNotes || "");
      setNextSuggestion(null);
      setSuggestError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isFutureTask = task.date > todayStr;
  const isPastTask = task.date < todayStr;
  const isTodayTask = task.date === todayStr;
  const plan = parseTaskPlan(task.aiSuggestion);

  const handleSave = async () => {
    if (isFutureTask) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          actualMinutes: Number(actualMinutes),
          completionNotes: notes,
          clientDate: todayStr,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSaved(data.task);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // AI runs only when the user asks for it
  const handleSuggestNext = async () => {
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch(`/api/goals/tasks/${task.id}/next-suggestion`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuggestError(data.error || "Failed to generate suggestion");
        return;
      }
      setNextSuggestion({ date: data.nextTask.date, text: data.nextTask.aiSuggestion });
      onNextSuggestion?.(data.nextTask.id, data.nextTask.aiSuggestion);
    } catch (e) {
      console.error(e);
      setSuggestError("Failed to generate suggestion");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 bg-gray-900 text-white flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {task.milestoneTopic || task.goalTitle || "Daily Goal Task"}
                </span>

                {isFutureTask && (
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-gray-700">
                    <Lock className="w-2.5 h-2.5 text-gray-400" /> Locked (Future Date)
                  </span>
                )}

                {isPastTask && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    Past Date (Missed / Catch-up)
                  </span>
                )}

                {isTodayTask && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/30">
                    Today&apos;s Focus
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold font-heading">{task.title}</h3>
              <p className="text-xs text-gray-400">Scheduled for {task.date}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Locked Notice for Future Tasks */}
          {isFutureTask && (
            <div className="mx-6 mt-4 p-3.5 bg-gray-100 border border-gray-200 rounded-2xl flex items-center gap-2.5 text-xs text-gray-700">
              <Lock className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                This task is scheduled for a future date (<strong>{task.date}</strong>). Future tasks are locked and cannot be updated until their scheduled date.
              </span>
            </div>
          )}

          {/* AI Weekly Plan for this day (structured) */}
          {plan && (
            <div className="mx-6 mt-4 p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900 block mb-0.5">AI Suggestion: What to achieve</span>
                  <span className="text-blue-900 leading-relaxed">{plan.focus}</span>
                </div>
              </div>

              {plan.why && (
                <div className="pl-6.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1 mb-0.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Why this, why now
                  </span>
                  <p className="text-blue-800 leading-relaxed">{plan.why}</p>
                </div>
              )}

              {plan.steps.length > 0 && (
                <div className="pl-6.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                    <ListChecks className="w-3.5 h-3.5" /> Steps
                  </span>
                  <ol className="list-decimal pl-4 space-y-0.5 text-blue-800 leading-relaxed">
                    {plan.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {plan.deliverable && (
                <div className="pl-6.5">
                  <span className="font-bold text-blue-900 flex items-center gap-1 mb-0.5">
                    <Flag className="w-3.5 h-3.5" /> Done when
                  </span>
                  <p className="text-blue-800 leading-relaxed">{plan.deliverable}</p>
                </div>
              )}

              {plan.weekTarget && (
                <div className="pt-2.5 border-t border-blue-200/70 flex items-start gap-1.5 text-[11px] text-blue-700">
                  <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-bold">This week&apos;s target:</span> {plan.weekTarget}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Daily Suggestion Box (legacy plain-text suggestion) */}
          {!plan && task.aiSuggestion && (
            <div className="mx-6 mt-4 p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900 block mb-0.5">AI Daily Suggestion:</span>
                <span className="text-blue-800 leading-relaxed">{task.aiSuggestion}</span>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Completion Toggle */}
            <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
              isFutureTask
                ? "bg-gray-50 border-gray-200 opacity-60"
                : isPastTask && status === "pending"
                ? "bg-amber-50/60 border-amber-200"
                : "bg-gray-50 border-gray-100"
            }`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isFutureTask}
                  onClick={() => !isFutureTask && setStatus(status === "completed" ? "pending" : "completed")}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isFutureTask
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : status === "completed"
                      ? "bg-emerald-600 text-white shadow-xs cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-pointer hover:bg-gray-300"
                  }`}
                >
                  {isFutureTask ? (
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  ) : status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    {isFutureTask
                      ? "Locked Until Scheduled Date"
                      : status === "completed"
                      ? "Marked as Completed"
                      : isPastTask
                      ? "Missed Task (Pending)"
                      : "Currently Pending"}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {isFutureTask
                      ? "Cannot mark future tasks complete in advance."
                      : status === "completed"
                      ? "Great job! This counts toward your 80% weekly reward target."
                      : isPastTask
                      ? "Click the circle to mark this missed task complete and recover your consistency rate."
                      : "Click icon to mark task complete."}
                  </span>
                </div>
              </div>
            </div>

            {/* Time Spent */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" /> Time Invested (Minutes)
              </label>
              <input
                type="number"
                disabled={isFutureTask}
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-blue-500 ${
                  isFutureTask ? "cursor-not-allowed opacity-60" : ""
                }`}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-500" /> What did you accomplish? (Notes &amp; output)
              </label>
              <textarea
                rows={3}
                disabled={isFutureTask}
                placeholder={isPastTask ? "e.g. Backfilled session on Sunday; solved 10 calculus problems." : "e.g. Practiced 10 matrix rotation problems..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 resize-none focus:outline-blue-500 ${
                  isFutureTask ? "cursor-not-allowed opacity-60" : ""
                }`}
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                {isFutureTask
                  ? "Editing is locked until this task's date arrives."
                  : "AI uses these notes when you generate a weekly plan or ask for a next-session suggestion."}
              </span>
            </div>
          </div>

          {/* On-demand AI suggestion for the next session (completed tasks only) */}
          {task.status === "completed" && (
            <div className="mx-6 mb-5 p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 text-xs space-y-2">
              {nextSuggestion ? (
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900 block mb-0.5">
                      Added to your {nextSuggestion.date} session:
                    </span>
                    <span className="text-gray-700 leading-relaxed">{nextSuggestion.text}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 leading-relaxed">
                    Want AI guidance for your next session based on these notes?
                  </span>
                  <button
                    type="button"
                    onClick={handleSuggestNext}
                    disabled={suggesting}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{suggesting ? "Thinking..." : "Suggest next session"}</span>
                  </button>
                </div>
              )}
              {suggestError && <p className="text-red-700 font-semibold">{suggestError}</p>}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {isFutureTask ? "Close" : "Cancel"}
            </button>
            {!isFutureTask && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? "Saving..." : isPastTask ? "Save Past Progress" : "Save Progress"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
