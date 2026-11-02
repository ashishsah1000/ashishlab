"use client";

import { useState } from "react";

export interface WeekChartItem {
  weekLabel: string;
  startStr: string;
  endStr: string;
  total: number;
  completed: number;
  rate: number;
  status: "green" | "red" | "gray";
  isFuture: boolean;
}

interface MilestoneWeeklyChartProps {
  weeks: WeekChartItem[];
}

export default function MilestoneWeeklyChart({ weeks }: MilestoneWeeklyChartProps) {
  const [hoveredWeek, setHoveredWeek] = useState<WeekChartItem | null>(null);

  return (
    <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
          Weekly Consistency (Last 8 Wks)
        </span>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> ≥80%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-rose-500 inline-block" /> &lt;80%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-blue-100 border border-blue-400 inline-block" /> Scheduled
          </span>
        </div>
      </div>

      <div className="relative flex items-center gap-1.5 flex-wrap">
        {weeks.map((wk, idx) => {
          let bg = "bg-gray-200 text-gray-500";
          if (wk.status === "green") {
            bg = "bg-emerald-500 text-white shadow-xs shadow-emerald-500/20";
          } else if (wk.status === "red") {
            bg = "bg-rose-500 text-white shadow-xs shadow-rose-500/20";
          } else if (wk.isFuture && wk.total > 0) {
            bg = "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100";
          }

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredWeek(wk)}
              onMouseLeave={() => setHoveredWeek(null)}
              className={`h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-105 ${bg}`}
            >
              W{idx + 1}
            </div>
          );
        })}

        {/* Tooltip */}
        {hoveredWeek && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-gray-950 text-white text-[11px] py-1 px-3 rounded-lg shadow-xl border border-gray-800 whitespace-nowrap">
            <span className="font-bold">{hoveredWeek.weekLabel}</span>:{" "}
            {hoveredWeek.total === 0 ? (
              <span className="text-gray-400">No tasks</span>
            ) : hoveredWeek.isFuture ? (
              <span className="text-blue-300 font-semibold">
                {hoveredWeek.total} tasks scheduled
              </span>
            ) : (
              <span className={hoveredWeek.status === "green" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {hoveredWeek.completed}/{hoveredWeek.total} ({hoveredWeek.rate}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
