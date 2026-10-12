"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Sparkles, Target, Gift, Clock, Calendar, CheckCircle } from "lucide-react";
import AiSuggestionBanner from "@/components/goals/AiSuggestionBanner";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { addMonths, format } from "date-fns";

interface MilestoneDraft {
  topic: string;
  dailyAllottedMinutes: number;
  targets: string;
  endOutput: string;
}

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Goal Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMonths, setDurationMonths] = useState(2);
  const [deadline, setDeadline] = useState(format(addMonths(new Date(), 2), "yyyy-MM-dd"));
  const [rewardCategory, setRewardCategory] = useState<"medium" | "large">("medium");

  // Vault Rewards State & Dropdown
  const [vaultRewards, setVaultRewards] = useState<any[]>([]);
  const [rewardSourceMode, setRewardSourceMode] = useState<"existing" | "new">("existing");
  const [selectedRewardId, setSelectedRewardId] = useState<number | "">("");

  // Inline Reward Form State
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardPrice, setRewardPrice] = useState("5000");

  useEffect(() => {
    const fetchVaultRewards = async () => {
      try {
        const res = await fetch("/api/goals/rewards");
        if (res.ok) {
          const data = await res.json();
          setVaultRewards(data.rewards || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchVaultRewards();
  }, []);

  // Filter available rewards for selected tier (EXCLUDE selected or redeemed!)
  const availableTierRewards = vaultRewards.filter(
    (r) => r.tier === rewardCategory && !r.isRedeemed && !r.isSelected
  );

  useEffect(() => {
    if (availableTierRewards.length > 0) {
      setSelectedRewardId(availableTierRewards[0].id);
      setRewardSourceMode("existing");
    } else {
      setSelectedRewardId("");
      setRewardSourceMode("new");
    }
  }, [rewardCategory, vaultRewards]);

  // Milestones draft
  const [milestonesList, setMilestonesList] = useState<MilestoneDraft[]>([
    {
      topic: "Core Fundamentals",
      dailyAllottedMinutes: 30,
      targets: "dot product, rotations, inverse etc",
      endOutput: "Solid conceptual clarity and fast practical implementation",
    },
  ]);

  const handleDurationChange = (months: number) => {
    setDurationMonths(months);
    setDeadline(format(addMonths(new Date(), months), "yyyy-MM-dd"));
  };

  const addMilestoneRow = () => {
    setMilestonesList([
      ...milestonesList,
      {
        topic: "",
        dailyAllottedMinutes: 30,
        targets: "",
        endOutput: "",
      },
    ]);
  };

  const [milestoneIndexToRemove, setMilestoneIndexToRemove] = useState<number | null>(null);

  const removeMilestoneRow = (index: number) => {
    if (milestonesList.length === 1) return;
    setMilestonesList(milestonesList.filter((_, i) => i !== index));
  };

  const handleRequestRemoveMilestone = (index: number) => {
    const m = milestonesList[index];
    if (!m || (!m.topic.trim() && !m.targets.trim())) {
      removeMilestoneRow(index);
    } else {
      setMilestoneIndexToRemove(index);
    }
  };

  const handleConfirmRemoveMilestone = () => {
    if (milestoneIndexToRemove !== null) {
      removeMilestoneRow(milestoneIndexToRemove);
      setMilestoneIndexToRemove(null);
    }
  };

  const updateMilestone = (index: number, field: keyof MilestoneDraft, value: any) => {
    const updated = [...milestonesList];
    updated[index] = { ...updated[index], [field]: value };
    setMilestonesList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a goal title");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        deadline: new Date(deadline).toISOString(),
        durationMonths,
        rewardCategory,
        rewardId: rewardSourceMode === "existing" && selectedRewardId ? Number(selectedRewardId) : null,
        newReward:
          rewardSourceMode === "new" && rewardTitle.trim()
            ? {
                title: rewardTitle.trim(),
                valueInr: Number(rewardPrice || 0),
                tier: rewardCategory,
              }
            : null,
        initialMilestones: milestonesList.filter((m) => m.topic.trim() && m.targets.trim()),
      };

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create goal");
      }

      const data = await res.json();
      router.push(`/goal/${data.goal.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 w-[92%] md:w-[85%] lg:w-[80%] mx-auto pt-32 pb-24">
        <Link
          href="/goals"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Goals Dashboard
        </Link>

        {/* Global AI Suggestion Banner */}
        <AiSuggestionBanner />

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xs">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Target className="w-3.5 h-3.5" /> Blueprint Creator
            </div>
            <h1 className="text-3xl font-black font-heading text-gray-900">
              Architect a New <span className="text-blue-600">Goal.</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set deadlines, attach completion rewards, and define daily milestones. Tasks will automatically be populated for every weekday.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Goal Details */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" /> 1. Goal Identity &amp; Scope
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Become a Researcher at Top MNC, or Lose 5kg in 2 Months"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Description &amp; Why It Matters</label>
                <textarea
                  rows={2}
                  placeholder="e.g. I want to transition into high-impact AI research by mastering the fundamentals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600 resize-none"
                />
              </div>

              {/* Deadline & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Target Deadline Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Quick Duration Presets</label>
                  <div className="flex gap-2">
                    {[1, 2, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleDurationChange(m)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                          durationMonths === m
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {m} {m === 1 ? "Mo" : "Mos"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Reward Association */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-500" /> 2. Completion Reward Attachment
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Attach a reward that unlocks when this goal is completed
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Locked until goal completed</span>
              </div>

              {/* Tier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRewardCategory("medium");
                    setRewardPrice("8000");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    rewardCategory === "medium"
                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-blue-700 block mb-1">
                    Medium Tier (&lt; ₹10,000)
                  </span>
                  <p className="text-xs font-bold text-gray-900">Items like premium headphones, smart jacket, books</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRewardCategory("large");
                    setRewardPrice("45000");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    rewardCategory === "large"
                      ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-purple-700 block mb-1">
                    Large Tier (&gt; ₹10,000)
                  </span>
                  <p className="text-xs font-bold text-gray-900">
                    Big milestone: Laptop, bike, trip. Includes 75% show-up early-unlock perk!
                  </p>
                </button>
              </div>

              {/* Source Switcher: Vault Dropdown vs New */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Choose Reward</label>
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setRewardSourceMode("existing")}
                      disabled={availableTierRewards.length === 0}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        rewardSourceMode === "existing"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900 disabled:opacity-40"
                      }`}
                    >
                      From Vault ({availableTierRewards.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewardSourceMode("new")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        rewardSourceMode === "new"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      + Create New
                    </button>
                  </div>
                </div>

                {rewardSourceMode === "existing" ? (
                  <div>
                    <select
                      value={selectedRewardId}
                      onChange={(e) => setSelectedRewardId(Number(e.target.value))}
                      className="w-full text-sm px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600"
                    >
                      {availableTierRewards.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} — ₹{r.valueInr} {r.description ? `(${r.description})` : ""}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      * Only unachieved {rewardCategory} rewards are shown. Achieved rewards are automatically hidden.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Reward Title *</label>
                      <input
                        type="text"
                        placeholder={rewardCategory === "medium" ? "e.g. Sony WH-1000XM5 Headphones" : "e.g. MacBook Air or Weekend Trip"}
                        value={rewardTitle}
                        onChange={(e) => setRewardTitle(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Estimated Value (₹ INR)</label>
                      <input
                        type="number"
                        value={rewardPrice}
                        onChange={(e) => setRewardPrice(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Milestones Builder */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" /> 3. Milestones &amp; Daily Schedule
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Weekday tasks (Mon-Fri) are generated automatically. Sat/Sun extra hours can be added freely.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMilestoneRow}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>

              <div className="space-y-4">
                {milestonesList.map((m, idx) => (
                  <div key={idx} className="p-5 bg-gray-50 rounded-3xl border border-gray-200 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                        Milestone #{idx + 1}
                      </span>
                      {milestonesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRequestRemoveMilestone(idx)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                          title="Remove Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-gray-700">Specific Topic *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Linear Algebra, LeetCode Trees, Daily Workout"
                          value={m.topic}
                          onChange={(e) => updateMilestone(idx, "topic", e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700">Daily Allotted Time</label>
                        <select
                          value={m.dailyAllottedMinutes}
                          onChange={(e) => updateMilestone(idx, "dailyAllottedMinutes", Number(e.target.value))}
                          className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-600"
                        >
                          <option value={15}>15 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={45}>45 mins</option>
                          <option value={60}>60 mins (1 hr)</option>
                          <option value={90}>90 mins (1.5 hrs)</option>
                          <option value={120}>120 mins (2 hrs)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">Sub-Targets &amp; Focus Concepts *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. dot product, rotations, inverse, eigenvalues, PCA"
                        value={m.targets}
                        onChange={(e) => updateMilestone(idx, "targets", e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">End Output / Competency Definition</label>
                      <input
                        type="text"
                        placeholder="e.g. I should be able to do rotations, dot products and understand ML important things"
                        value={m.endOutput}
                        onChange={(e) => updateMilestone(idx, "endOutput", e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Weekly reward kicks in immediately at 80% completion!
              </span>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <span>Generating Schedule &amp; Tasks...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Launch Goal &amp; Tasks</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {milestoneIndexToRemove !== null && (
        <DeleteConfirmationModal
          isOpen={milestoneIndexToRemove !== null}
          onClose={() => setMilestoneIndexToRemove(null)}
          onConfirm={handleConfirmRemoveMilestone}
          itemType="Draft Milestone"
          itemName={milestonesList[milestoneIndexToRemove]?.topic || `Milestone #${milestoneIndexToRemove + 1}`}
          description={milestonesList[milestoneIndexToRemove]?.targets || undefined}
          details={[
            {
              label: "Daily Time",
              value: `${milestonesList[milestoneIndexToRemove]?.dailyAllottedMinutes} mins`,
            },
          ]}
          warningMessage="Removing this milestone will permanently discard its configured topic and concepts from this blueprint."
          confirmCheckboxLabel="I confirm that I want to remove this milestone from the builder."
          deleteButtonText="Remove Milestone"
        />
      )}
    </main>
  );
}
