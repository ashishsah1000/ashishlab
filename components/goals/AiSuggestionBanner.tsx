"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ArrowRight, Zap, Target } from "lucide-react";
import Link from "next/link";

interface SuggestionData {
  summary: string;
  advice: string;
  todayPendingCount?: number;
  priorityFocus?: string;
}

export default function AiSuggestionBanner() {
  const [data, setData] = useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/daily-suggestion");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, []);

  if (!loading && !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 p-[1px] shadow-lg shadow-blue-950/10 mb-8"
    >
      <div className="relative rounded-2xl bg-gray-950/85 backdrop-blur-xl p-5 md:p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> AI Daily Coach
              </span>
              {data?.todayPendingCount !== undefined && data.todayPendingCount > 0 && (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                  {data.todayPendingCount} tasks pending today
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-1 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Analyzing your milestones and consistency...</span>
              </div>
            ) : (
              <>
                <p className="text-sm md:text-base font-semibold text-gray-100 leading-snug">
                  {data?.summary}
                </p>
                <p className="text-xs md:text-sm text-gray-300 font-light leading-relaxed">
                  {data?.advice}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={fetchSuggestion}
            disabled={loading}
            title="Refresh Coach Insight"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/weekly/goals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Weekly Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
