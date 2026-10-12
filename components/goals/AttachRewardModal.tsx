"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Plus, Sparkles, Check, ArrowRight } from "lucide-react";

interface RewardItem {
  id: number;
  title: string;
  description: string | null;
  tier: "small" | "medium" | "large";
  valueInr: number;
  isRedeemed: boolean;
  isSelected?: boolean;
  associatedGoalId: number | null;
}

interface AttachRewardModalProps {
  goalId: number;
  goalTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onAttached: () => void;
}

export default function AttachRewardModal({
  goalId,
  goalTitle,
  isOpen,
  onClose,
  onAttached,
}: AttachRewardModalProps) {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<"medium" | "large">("medium");
  const [attachMode, setAttachMode] = useState<"existing" | "new">("existing");

  // Existing selection state
  const [selectedRewardId, setSelectedRewardId] = useState<number | "">("");

  // New reward creation state
  const [newTitle, setNewTitle] = useState("");
  const [newValueInr, setNewValueInr] = useState("5000");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRewards();
      setError("");
    }
  }, [isOpen]);

  // Filter available rewards:
  // Once selected or redeemed, rewards do NOT appear in the dropdown!
  const availableTierRewards = rewards.filter(
    (r) => r.tier === selectedTier && !r.isRedeemed && !r.isSelected
  );

  useEffect(() => {
    if (availableTierRewards.length > 0) {
      setSelectedRewardId(availableTierRewards[0].id);
    } else {
      setSelectedRewardId("");
      setAttachMode("new");
    }
  }, [selectedTier, rewards]);

  const handleTierSwitch = (tier: "medium" | "large") => {
    setSelectedTier(tier);
    if (tier === "medium") setNewValueInr("5000");
    if (tier === "large") setNewValueInr("25000");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let finalRewardId = selectedRewardId;

      if (attachMode === "new") {
        if (!newTitle.trim()) {
          throw new Error("Please provide a reward title");
        }
        // 1. Create new reward
        const rRes = await fetch("/api/goals/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle.trim(),
            description: newDescription.trim(),
            tier: selectedTier,
            valueInr: Number(newValueInr || 0),
            associatedGoalId: goalId,
          }),
        });

        if (!rRes.ok) {
          const rData = await rRes.json();
          throw new Error(rData.error || "Failed to create reward");
        }

        const rData = await rRes.json();
        finalRewardId = rData.reward.id;
      }

      if (!finalRewardId) {
        throw new Error("Please select or create a reward");
      }

      // 2. Attach reward to goal via PATCH
      const gRes = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: Number(finalRewardId),
          rewardCategory: selectedTier,
        }),
      });

      if (!gRes.ok) {
        const gData = await gRes.json();
        throw new Error(gData.error || "Failed to attach reward to goal");
      }

      onAttached();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-gray-900">
                  Goal Attachment
                </span>
                <span className="text-xs text-gray-300 line-clamp-1">{goalTitle}</span>
              </div>
              <h3 className="text-xl font-bold font-heading">Attach Completion Reward</h3>
              <p className="text-xs text-gray-400">
                Pick an existing unachieved reward from your vault or create a brand new one
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 1. Tier Switcher */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                1. Select Reward Tier Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTierSwitch("medium")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedTier === "medium"
                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-blue-700 block mb-0.5">
                    Medium Tier (&lt; ₹10,000)
                  </span>
                  <span className="text-xs font-bold text-gray-900 block">Monthly / Milestone Reward</span>
                  <span className="text-[10px] text-gray-500">Headphones, clothes, tech gadgets</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTierSwitch("large")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedTier === "large"
                      ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-purple-700 block mb-0.5">
                    Large Tier (&gt; ₹10,000)
                  </span>
                  <span className="text-xs font-bold text-gray-900 block">Major Goal Completion</span>
                  <span className="text-[10px] text-gray-500">Laptop, bike, trip (+ 75% showup perk)</span>
                </button>
              </div>
            </div>

            {/* 2. Choose Mode: Existing Vault Dropdown vs Create New */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700">2. Select Reward Source</label>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAttachMode("existing")}
                    disabled={availableTierRewards.length === 0}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      attachMode === "existing"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900 disabled:opacity-40"
                    }`}
                  >
                    From Vault ({availableTierRewards.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachMode("new")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      attachMode === "new"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    + Create New
                  </button>
                </div>
              </div>

              {attachMode === "existing" ? (
                <div>
                  <select
                    value={selectedRewardId}
                    onChange={(e) => setSelectedRewardId(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-blue-500"
                  >
                    {availableTierRewards.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — ₹{r.valueInr} {r.description ? `(${r.description})` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    * Achieved/claimed rewards are automatically filtered out from this list.
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Reward Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          selectedTier === "medium"
                            ? "e.g. Sony WH-1000XM5 Headphones"
                            : "e.g. Apple MacBook Air M3"
                        }
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Value (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={newValueInr}
                        onChange={(e) => setNewValueInr(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Buy when goal target milestone is unlocked"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (attachMode === "existing" && !selectedRewardId)}
                className="px-5 py-2 text-xs font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-xs"
              >
                {saving ? "Attaching..." : "Attach Reward to Goal"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
