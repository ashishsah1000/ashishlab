"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Calendar, Gift, Mail, Target, ArrowRight, CheckCircle2, TrendingUp, Clock, AlertCircle, Trash2 } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import GitMonthChart, { DayChartItem } from "@/components/goals/GitMonthChart";
import RewardsStoreModal from "@/components/goals/RewardsStoreModal";
import EmailTriggerModal from "@/components/goals/EmailTriggerModal";
import AttachRewardModal from "@/components/goals/AttachRewardModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { format, differenceInDays } from "date-fns";

interface GoalWithStats {
  id: number;
  title: string;
  description: string;
  deadline: string;
  durationMonths: number;
  status: string;
  rewardCategory: string;
  rewardId: number | null;
  mediumRewardUnlocked: boolean;
  milestonesCount: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  reward: {
    id: number;
    title: string;
    tier: string;
    valueInr: number;
    isRedeemed: boolean;
  } | null;
  monthGitChart: DayChartItem[];
}

export default function GoalsDashboardPage() {
  const [goalsList, setGoalsList] = useState<GoalWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [attachModalGoal, setAttachModalGoal] = useState<GoalWithStats | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalWithStats | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json();
        setGoalsList(data.goals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    setIsDeletingGoal(true);
    try {
      const res = await fetch(`/api/goals/${goalToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setGoalToDelete(null);
        await fetchGoals();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingGoal(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const totalGoals = goalsList.length;
  const activeGoals = goalsList.filter((g) => g.status === "active").length;
  const totalTasksAll = goalsList.reduce((acc, g) => acc + g.totalTasks, 0);
  const totalCompletedAll = goalsList.reduce((acc, g) => acc + g.completedTasks, 0);
  const overallRate = totalTasksAll > 0 ? Math.round((totalCompletedAll / totalTasksAll) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-100">
              <Target className="w-3.5 h-3.5" /> High-Performance Goal Monitor
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-heading tracking-tight text-gray-900">
              My Goals <span className="text-blue-600">&amp; Habits.</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Track milestones, show up with 80% daily consistency, and unlock tiered rewards.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/weekly/goals"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-2xl border border-gray-200 transition-all shadow-xs"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Weekly Calendar</span>
            </Link>

            <button
              onClick={() => setRewardsOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-2xl border border-gray-200 transition-all shadow-xs"
            >
              <Gift className="w-4 h-4 text-amber-500" />
              <span>Rewards Store</span>
            </button>

            <button
              onClick={() => setEmailOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-2xl border border-gray-200 transition-all shadow-xs"
            >
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Email Reports</span>
            </button>

            <Link
              href="/create/goal"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </Link>
          </div>
        </div>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Active Goals
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-heading text-gray-900">{activeGoals}</span>
              <span className="text-xs text-gray-400">/ {totalGoals} total</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Tasks Completed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-heading text-gray-900">{totalCompletedAll}</span>
              <span className="text-xs text-gray-400">/ {totalTasksAll}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Overall Consistency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-heading text-blue-600">{overallRate}%</span>
              <span className="text-xs text-gray-400">target: 80%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Weekly Reward
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {overallRate >= 80 ? (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  🎁 Ready To Claim
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-gray-900">Active Goals &amp; Monthly Grids</h2>
            <span className="text-xs text-gray-400">Heatmap reflects 80% daily success</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-sm text-gray-400 border border-gray-100">
              Loading your goals and performance records...
            </div>
          ) : goalsList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">No Goals Created Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Set ambitious targets like &quot;Become a Researcher at Top MNC&quot; or &quot;Lose 5kg in 2 months&quot;, attach your dream reward, and let AI structure your daily tasks.
                </p>
              </div>
              <Link
                href="/create/goal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-gray-800 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Goal</span>
              </Link>
            </div>
          ) : (
            goalsList.map((goal) => {
              const deadlineDate = new Date(goal.deadline);
              const daysRemaining = differenceInDays(deadlineDate, new Date());

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-6"
                >
                  {/* Goal Info Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                          {goal.status}
                        </span>

                        {goal.reward ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-amber-600" />
                            {goal.reward.tier.toUpperCase()} REWARD: {goal.reward.title} (₹{goal.reward.valueInr})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAttachModalGoal(goal)}
                            className="px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Attach a completion reward to this goal"
                          >
                            <Plus className="w-3 h-3" />
                            Add Reward
                          </button>
                        )}

                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Deadline: {format(deadlineDate, "MMM dd, yyyy")}
                          {daysRemaining >= 0 ? ` (${daysRemaining} days left)` : " (Passed)"}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black font-heading text-gray-900 tracking-tight">
                        {goal.title}
                      </h3>

                      {goal.description && (
                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-2xl">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Link Buttons for this goal */}
                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <Link
                        href={`/goal/${goal.id}`}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                      >
                        Milestones ({goal.milestonesCount})
                      </Link>
                      <Link
                        href={`/overview/goals/${goal.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span>Deep Analytics</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-colors border border-gray-200 hover:border-rose-200"
                        title="Delete Goal Blueprint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">
                        Total Task Progress: <strong>{goal.completedTasks}</strong> / {goal.totalTasks} completed
                      </span>
                      <span className="font-black text-blue-600">{goal.completionRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(goal.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Git-like Contribution Heatmap for the Month */}
                  <div>
                    <GitMonthChart days={goal.monthGitChart} />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Rewards Store Modal */}
      <RewardsStoreModal
        isOpen={rewardsOpen}
        onClose={() => setRewardsOpen(false)}
        onRewardClaimed={() => fetchGoals()}
      />

      {/* Email Trigger Modal */}
      <EmailTriggerModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
      />

      {/* Attach Reward Modal */}
      {attachModalGoal && (
        <AttachRewardModal
          goalId={attachModalGoal.id}
          goalTitle={attachModalGoal.title}
          isOpen={!!attachModalGoal}
          onClose={() => setAttachModalGoal(null)}
          onAttached={() => fetchGoals()}
        />
      )}

      {/* Delete Goal Confirmation Modal */}
      {goalToDelete && (
        <DeleteConfirmationModal
          isOpen={!!goalToDelete}
          onClose={() => setGoalToDelete(null)}
          onConfirm={handleConfirmDeleteGoal}
          itemType="Goal Blueprint"
          itemName={goalToDelete.title}
          description={goalToDelete.description || undefined}
          details={[
            { label: "Target Deadline", value: format(new Date(goalToDelete.deadline), "MMM dd, yyyy") },
            { label: "Milestones", value: `${goalToDelete.milestonesCount} milestones` },
            {
              label: "Task Progress",
              value: `${goalToDelete.completedTasks}/${goalToDelete.totalTasks} completed (${goalToDelete.completionRate}%)`,
            },
            {
              label: "Completion Perk",
              value: goalToDelete.reward ? `${goalToDelete.reward.title} (₹${goalToDelete.reward.valueInr})` : "None",
            },
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
