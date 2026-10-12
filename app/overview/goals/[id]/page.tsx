"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, Calendar, Gift, Sparkles, RefreshCw, BarChart2, ShieldAlert, Plus, Trash2 } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import GitMonthChart, { DayChartItem } from "@/components/goals/GitMonthChart";
import AttachRewardModal from "@/components/goals/AttachRewardModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format, differenceInDays } from "date-fns";

export default function GoalOverviewAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const goalId = resolvedParams.id;

  const [goal, setGoal] = useState<any>(null);
  const [reward, setReward] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [monthGitChart, setMonthGitChart] = useState<DayChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI report state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showAttachRewardModal, setShowAttachRewardModal] = useState(false);
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  const handleConfirmDeleteGoal = async () => {
    if (!goal) return;
    setIsDeletingGoal(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteGoalModal(false);
        router.push("/goals");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`);
      if (res.ok) {
        const data = await res.json();
        setGoal(data.goal);
        setReward(data.reward);
        setMilestones(data.milestones || []);
        setAnalytics(data.analytics);
        setMonthGitChart(data.monthGitChart || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [goalId]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/ai/goal-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24 text-center text-sm text-gray-400">
          Calculating precision goal analytics and charts...
        </div>
      </main>
    );
  }

  if (!goal || !analytics) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Goal Not Found</h2>
          <Link href="/goals" className="text-blue-600 font-semibold text-sm">Return to Goals</Link>
        </div>
      </main>
    );
  }

  const deadlineDate = new Date(goal.deadline);
  const daysLeft = differenceInDays(deadlineDate, new Date());

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/goal/${goal.id}`}
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Goal Milestones
          </Link>

          <Link
            href="/weekly/goals"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Open Weekly Calendar →
          </Link>
        </div>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        {/* Header Summary Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                  Deep Performance Analytics
                </span>

                {reward ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-amber-600" />
                    Target: {reward.title} (₹{reward.valueInr})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAttachRewardModal(true)}
                    className="px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Attach a completion reward to this goal"
                  >
                    <Plus className="w-3 h-3" />
                    Add Reward
                  </button>
                )}

                <span className="text-xs text-gray-400">
                  Target Deadline: {format(deadlineDate, "MMMM dd, yyyy")} ({daysLeft >= 0 ? `${daysLeft} days remaining` : "Passed"})
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-gray-900">
                {goal.title}
              </h1>

              {goal.description && (
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-2xl">
                  {goal.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{generatingReport ? "Synthesizing AI Report..." : "Generate AI Coach Report"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteGoalModal(true)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-colors border border-rose-200"
                title="Delete Goal Blueprint"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Core Analytics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* 1. Overall Completion Rate */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Overall Completed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-heading text-blue-600">
                {analytics.overallCompletionRate}%
              </span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              {analytics.completedTasks} of {analytics.totalTasks} total tasks
            </span>
          </div>

          {/* 2. Failure Rate */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Task Failure Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-heading ${analytics.failureRate > 25 ? "text-rose-500" : "text-gray-900"}`}>
                {analytics.failureRate}%
              </span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              {analytics.pastMissed} missed of {analytics.pastTotal} past tasks
            </span>
          </div>

          {/* 3. Consistency Show-up Rate */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Show-Up Consistency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-heading text-emerald-600">
                {analytics.showUpRate}%
              </span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Historical execution rate
            </span>
          </div>

          {/* 4. Reward Status */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Reward Qualification
            </span>
            <div className="mt-1">
              {goal.rewardCategory === "large" ? (
                analytics.isEligibleForMediumReward ? (
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 block text-center">
                    ✨ Medium Perk Unlocked (≥75%)
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 block">
                    {analytics.showUpRate}% / 75% for Medium early perk
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full block text-center">
                  Medium Goal Reward
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Large Reward 75% Show-Up Rule Card (if large reward goal) */}
        {goal.rewardCategory === "large" && (
          <div className="bg-purple-950 text-white rounded-3xl p-6 mb-8 border border-purple-800 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-purple-300">
                    Rule from Specification
                  </span>
                  {analytics.isEligibleForMediumReward && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm">
                  75% Show-Up Perk for Large Reward Goals
                </h4>
                <p className="text-xs text-purple-200 leading-relaxed">
                  If this goal carries a large reward (laptop, bike, trip), maintaining a 75% show-up rate across daily tasks qualifies you for a Medium Reward (&lt; ₹10,000) during the journey! Current show-up rate: <strong>{analytics.showUpRate}%</strong>.
                </p>

                <div className="pt-2">
                  <div className="w-full h-2.5 bg-purple-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                      style={{ width: `${Math.min(analytics.showUpRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Git-like Contribution Heatmap for the Month */}
        <div className="mb-8 space-y-3">
          <h3 className="text-base font-bold font-heading text-gray-900">
            Git Consistency Heatmap (Current Month)
          </h3>
          <GitMonthChart days={monthGitChart} />
        </div>

        {/* Weekday Consistency Breakdown Chart */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" /> Day-of-Week Execution Consistency
            </h3>
            <span className="text-xs text-gray-400">Identifies weekday fatigue patterns</span>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-2">
            {analytics.weekdayBreakdown.filter((w: any) => ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(w.day)).map((w: any) => (
              <div key={w.day} className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 text-center space-y-2">
                <span className="text-xs font-bold text-gray-500 block uppercase">{w.day}</span>
                <span className={`text-xl font-black font-heading block ${w.rate >= 80 ? "text-emerald-600" : w.rate >= 50 ? "text-amber-600" : "text-gray-400"}`}>
                  {w.rate}%
                </span>
                <span className="text-[10px] text-gray-400 block">
                  {w.completed}/{w.total} tasks
                </span>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.rate >= 80 ? "bg-emerald-500" : w.rate >= 50 ? "bg-amber-500" : "bg-rose-400"}`}
                    style={{ width: `${w.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Breakdown Cards */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs mb-8 space-y-4">
          <h3 className="text-base font-bold font-heading text-gray-900">
            Milestone Breakdown &amp; Completion Status
          </h3>

          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{m.topic}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      m.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-700"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{m.targets}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block">{m.completionRate}%</span>
                    <span className="text-[10px] text-gray-400">{m.completedTasks} / {m.totalTasks} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance & Improvement Report Section */}
        {aiReport && (
          <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-lg shadow-blue-500/5 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-gray-900">
                    AI Strategic Coach Analysis
                  </h3>
                  <p className="text-xs text-gray-400">Generated using Gemini 2.5 Flash from actual completion telemetry</p>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Regenerate Report"
              >
                <RefreshCw className={`w-4 h-4 ${generatingReport ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="prose prose-sm prose-blue max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-900 text-gray-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiReport}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Attach Reward Modal */}
      {showAttachRewardModal && goal && (
        <AttachRewardModal
          goalId={goal.id}
          goalTitle={goal.title}
          isOpen={showAttachRewardModal}
          onClose={() => setShowAttachRewardModal(false)}
          onAttached={() => fetchOverview()}
        />
      )}

      {/* Delete Goal Confirmation Modal */}
      {showDeleteGoalModal && goal && (
        <DeleteConfirmationModal
          isOpen={showDeleteGoalModal}
          onClose={() => setShowDeleteGoalModal(false)}
          onConfirm={handleConfirmDeleteGoal}
          itemType="Goal Blueprint"
          itemName={goal.title}
          description={goal.description || undefined}
          details={[
            { label: "Target Deadline", value: format(new Date(goal.deadline), "MMM dd, yyyy") },
            { label: "Milestones", value: `${milestones.length} milestones` },
            { label: "Completion Rate", value: `${analytics?.completionRate || 0}%` },
            { label: "Completion Perk", value: reward ? `${reward.title} (₹${reward.valueInr})` : "None" },
          ]}
          warningMessage="Deleting this goal blueprint will permanently delete all associated milestones, scheduled daily tasks, and analytics. Any attached reward will remain safely in your vault."
          confirmCheckboxLabel="I confirm that I want to permanently delete this goal blueprint."
          deleteButtonText="Delete Goal"
          isDeleting={isDeletingGoal}
        />
      )}
    </main>
  );
}
