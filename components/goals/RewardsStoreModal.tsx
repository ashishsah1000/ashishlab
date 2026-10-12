"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Check, Plus, Sparkles, AlertCircle, ShoppingBag, Trash2, Tag, Calendar } from "lucide-react";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

interface RewardItem {
  id: number;
  title: string;
  description: string | null;
  tier: "small" | "medium" | "large";
  valueInr: number;
  isRedeemed: boolean;
  isSelected?: boolean;
  redeemedAt: string | null;
  associatedGoalId: number | null;
  claimsCount?: number;
}

interface RewardsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: () => void;
  onlyTier?: "small" | "medium" | "large";
  isUnlocked?: boolean;
  weekStart?: string;
  weekEnd?: string;
}

export default function RewardsStoreModal({
  isOpen,
  onClose,
  onRewardClaimed,
  onlyTier,
  isUnlocked,
  weekStart,
  weekEnd,
}: RewardsStoreModalProps) {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "small" | "medium" | "large">(
    onlyTier || "all"
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [claimMessage, setClaimMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New reward form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTier, setNewTier] = useState<"small" | "medium" | "large">(
    onlyTier || "medium"
  );
  const [newValueInr, setNewValueInr] = useState(onlyTier === "small" ? "500" : "5000");
  const [savingReward, setSavingReward] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const url = weekStart && weekEnd
        ? `/api/goals/rewards?weekStart=${encodeURIComponent(weekStart)}&weekEnd=${encodeURIComponent(weekEnd)}`
        : "/api/goals/rewards";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
        setWeeklyStats(data.weeklyStats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (onlyTier) {
        setActiveTab(onlyTier);
        setNewTier(onlyTier);
        if (onlyTier === "small") setNewValueInr("500");
      }
      fetchRewards();
      setClaimMessage(null);
    }
  }, [isOpen, onlyTier, weekStart, weekEnd]);

  const handleOpenAddForm = () => {
    if (!showCreateForm) {
      // Pre-select tier matching the active tab or locked tier
      if (onlyTier === "small" || activeTab === "small") {
        setNewTier("small");
        setNewValueInr("500");
      } else if (activeTab === "large") {
        setNewTier("large");
        setNewValueInr("25000");
      } else {
        setNewTier("medium");
        setNewValueInr("5000");
      }
    }
    setShowCreateForm(!showCreateForm);
  };

  const handleSelectTier = (tier: "small" | "medium" | "large") => {
    setNewTier(tier);
    if (tier === "small") setNewValueInr("500");
    if (tier === "medium") setNewValueInr("5000");
    if (tier === "large") setNewValueInr("25000");
  };

  const handleClaim = async (rewardId: number) => {
    setClaimingId(rewardId);
    setClaimMessage(null);
    try {
      const res = await fetch("/api/goals/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId,
          weekStart: weekStart || weeklyStats?.weekStart,
          weekEnd: weekEnd || weeklyStats?.weekEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimMessage({ text: data.error || "Failed to claim reward", type: "error" });
      } else {
        setClaimMessage({
          text: data.message || "🎉 Reward redeemed successfully! Enjoy your well-earned reward!",
          type: "success",
        });
        await fetchRewards();
        if (onRewardClaimed) onRewardClaimed();
      }
    } catch (e: any) {
      setClaimMessage({ text: e.message || "Failed to claim reward", type: "error" });
    } finally {
      setClaimingId(null);
    }
  };

  const [rewardToDelete, setRewardToDelete] = useState<RewardItem | null>(null);

  const handleConfirmDeleteReward = async () => {
    if (!rewardToDelete) return;
    const { id, title } = rewardToDelete;
    setDeletingId(id);
    setClaimMessage(null);
    try {
      const res = await fetch(`/api/goals/rewards?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setClaimMessage({ text: `"${title}" was removed from the Rewards Vault.`, type: "success" });
        setRewardToDelete(null);
        await fetchRewards();
        if (onRewardClaimed) onRewardClaimed();
      } else {
        const data = await res.json();
        setClaimMessage({ text: data.error || "Failed to delete reward", type: "error" });
      }
    } catch (e: any) {
      setClaimMessage({ text: e.message || "Failed to delete reward", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSavingReward(true);
    try {
      const res = await fetch("/api/goals/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          tier: newTier,
          valueInr: Number(newValueInr),
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setShowCreateForm(false);
        setClaimMessage({ text: `🎉 Added "${newTitle.trim()}" to Rewards Vault!`, type: "success" });
        await fetchRewards();
        if (onRewardClaimed) onRewardClaimed();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingReward(false);
    }
  };

  if (!isOpen) return null;

  const filteredRewards = onlyTier
    ? rewards.filter((r) => r.tier === onlyTier)
    : activeTab === "all"
    ? rewards
    : rewards.filter((r) => r.tier === activeTab);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl w-[95%] md:w-[90%] lg:w-[85%] max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-gray-900 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
                  {onlyTier === "small" ? "Weekly Micro-Rewards Store" : "Rewards Vault & Store"}
                </h2>
                <p className="text-xs md:text-sm text-gray-300 mt-0.5">
                  {onlyTier === "small"
                    ? "Weekly micro-rewards (< ₹1,000) for achieving ≥80% consistency. Repeatable — claim anytime without removal!"
                    : "Claim weekly micro-rewards (≥80%) multiple times, and attach major rewards to goal completion"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Weekly Status Banner */}
          {weeklyStats && (
            <div className="px-6 md:px-8 py-4 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold">
                  Week: {weeklyStats.weekStart}
                </span>
                <span className="text-gray-700 font-medium">
                  Consistency: <strong>{weeklyStats.completedTasks}/{weeklyStats.totalTasks}</strong> ({weeklyStats.weeklyRate}%)
                </span>
              </div>
              <div>
                {(isUnlocked ?? weeklyStats.isEligible) ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 80% Unlocked! Weekly Small Rewards Ready to Claim
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-medium">
                    Reach 80% to unlock weekly small reward ({80 - weeklyStats.weeklyRate}% to go)
                  </span>
                )}
              </div>
            </div>
          )}

          {claimMessage && (
            <div
              className={`mx-6 md:mx-8 mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shrink-0 ${
                claimMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {claimMessage.type === "success" ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{claimMessage.text}</span>
            </div>
          )}

          {/* Controls & Tabs */}
          <div className="px-6 md:px-8 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-gray-100 shrink-0">
            {onlyTier ? (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Weekly Micro-Rewards (&lt; ₹1,000)
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  Repeatable award • Never gets removed on claim
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs">
                {(["all", "small", "medium", "large"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-gray-900 text-white shadow-xs"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab === "all" ? "All Vault Items" : `${tab} tier`}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? "Close Form" : onlyTier === "small" ? "Add Weekly Reward" : "Add Reward"}</span>
            </button>
          </div>

          {/* Interactive Create Reward Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateReward} className="p-6 md:p-8 bg-gray-50 border-b border-gray-200 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {onlyTier === "small" ? "Add New Weekly Micro-Reward" : "Add New Reward to Vault"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {onlyTier === "small"
                      ? "Weekly small items (< ₹1,000) that you can redeem repeatedly when hitting 80% consistency"
                      : "Select tier category, price, and descriptive title"}
                  </p>
                </div>
              </div>

              {onlyTier === "small" ? (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">Weekly Micro-Reward Tier (&lt; ₹1,000)</span>
                    <span className="text-[10px] text-emerald-700">Repeatable award • Coffee, dessert, books, favorite treat</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 px-2.5 py-1 rounded-full bg-emerald-100 uppercase tracking-wider">
                    Weekly Small Tier
                  </span>
                </div>
              ) : (
                /* Tier Selection Buttons */
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">1. Reward Category Tier *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectTier("small")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        newTier === "small"
                          ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-emerald-700 block mb-0.5">Small Tier (&lt; ₹1,000)</span>
                      <span className="text-xs font-bold text-gray-900 block">Weekly Micro-Reward</span>
                      <span className="text-[10px] text-gray-500">Repeatable weekly (coffee, book, treats)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTier("medium")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        newTier === "medium"
                          ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-blue-700 block mb-0.5">Medium Tier (&lt; ₹10,000)</span>
                      <span className="text-xs font-bold text-gray-900 block">Monthly / Goal Milestone</span>
                      <span className="text-[10px] text-gray-500">Headphones, courses, wardrobe upgrade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTier("large")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        newTier === "large"
                          ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-purple-700 block mb-0.5">Large Tier (&gt; ₹10,000)</span>
                      <span className="text-xs font-bold text-gray-900 block">Major Goal Accomplishment</span>
                      <span className="text-[10px] text-gray-500">Laptop, vacation, sports bike</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    {onlyTier === "small" ? "Reward Title *" : "2. Reward Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newTier === "small"
                        ? "e.g. Specialty Dark Chocolate & Espresso"
                        : newTier === "medium"
                        ? "e.g. Sony WH-1000XM5 Headphones"
                        : "e.g. M3 MacBook Air or Weekend Getaway"
                    }
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Estimated Value (₹ INR)</label>
                  <input
                    type="number"
                    value={newValueInr}
                    onChange={(e) => setNewValueInr(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased from favorite local bakery or cafe"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReward}
                  className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-xs"
                >
                  {savingReward ? "Saving..." : "Save Reward to Vault"}
                </button>
              </div>
            </form>
          )}

          {/* Rewards Grid (Roomy 3-column Layout) */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1">
            {loading ? (
              <div className="text-center py-16 text-sm text-gray-400">Loading rewards vault...</div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-3">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-sm font-semibold">
                  {onlyTier === "small" ? "No weekly micro-rewards found in your vault." : "No rewards in this tier yet."}
                </p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Click &quot;{onlyTier === "small" ? "Add Weekly Reward" : "Add Reward"}&quot; above to create weekly treats like coffee, a book, or favorite snacks!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRewards.map((reward) => {
                  const isSmall = reward.tier === "small";
                  const canClaimSmall = isSmall && (isUnlocked !== undefined ? isUnlocked : (weeklyStats?.isEligible ?? false));

                  return (
                    <div
                      key={reward.id}
                      className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                        reward.isRedeemed
                          ? "bg-gray-50/80 border-gray-200 opacity-75"
                          : "bg-white border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                              reward.tier === "small"
                                ? "bg-emerald-100 text-emerald-800"
                                : reward.tier === "medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {reward.tier} • ₹{reward.valueInr}
                          </span>

                          <div className="flex items-center gap-1">
                            {isSmall ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-500" /> Repeatable
                                {reward.claimsCount ? ` • ${reward.claimsCount}x claimed` : ""}
                              </span>
                            ) : reward.isRedeemed ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Achieved
                              </span>
                            ) : null}

                            {/* Delete Reward Button */}
                            <button
                              type="button"
                              onClick={() => setRewardToDelete(reward)}
                              disabled={deletingId === reward.id}
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                              title="Delete reward (unlinks any associated goal)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Details */}
                        <h4 className="font-bold text-base text-gray-900 mt-1 mb-1 leading-snug">
                          {reward.title}
                        </h4>

                        {reward.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                            {reward.description}
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-3">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {isSmall ? "Weekly (≥80%)" : reward.isRedeemed ? "Goal Achieved" : "Linked to Goal"}
                        </span>

                        {isSmall ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handleClaim(reward.id)}
                              disabled={!canClaimSmall || claimingId === reward.id}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 ${
                                canClaimSmall
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>
                                {claimingId === reward.id
                                  ? "Claiming..."
                                  : canClaimSmall
                                  ? "Claim Weekly Reward"
                                  : "Locked (Need ≥80%)"}
                              </span>
                            </button>
                            <span className="text-[9px] text-emerald-600 font-semibold">
                              Does not get removed on claim
                            </span>
                          </div>
                        ) : reward.isRedeemed ? (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Achieved &amp; Claimed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaim(reward.id)}
                            disabled={claimingId === reward.id}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white transition-all shadow-2xs"
                          >
                            {claimingId === reward.id ? "Updating..." : "Mark Achieved"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {rewardToDelete && (
        <DeleteConfirmationModal
          isOpen={!!rewardToDelete}
          onClose={() => setRewardToDelete(null)}
          onConfirm={handleConfirmDeleteReward}
          itemType="Reward Vault Item"
          itemName={rewardToDelete.title}
          description={rewardToDelete.description || undefined}
          details={[
            { label: "Category Tier", value: `${rewardToDelete.tier.toUpperCase()} Tier` },
            { label: "Target Value", value: `₹${rewardToDelete.valueInr}` },
            {
              label: "Status",
              value:
                rewardToDelete.tier === "small"
                  ? "Weekly Repeatable"
                  : rewardToDelete.isRedeemed
                  ? "Achieved"
                  : "Active / Linked",
            },
          ]}
          warningMessage="Deleting this reward will permanently remove it from your vault and unbind it from any goal referencing it."
          confirmCheckboxLabel="I confirm that I want to delete this reward and understand it cannot be recovered."
          deleteButtonText="Delete Reward"
          isDeleting={deletingId === rewardToDelete.id}
        />
      )}
    </AnimatePresence>
  );
}
