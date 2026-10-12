"use client";

import { useState } from "react";
import { format } from "date-fns";

export interface DayChartItem {
  date: string;
  day: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  status: "green" | "red" | "gray" | "empty";
  isFuture: boolean;
}

interface GitMonthChartProps {
  days: DayChartItem[];
  monthLabel?: string;
}

export default function GitMonthChart({ days, monthLabel }: GitMonthChartProps) {
  const [hoveredDay, setHoveredDay] = useState<DayChartItem | null>(null);

  // Calculate consistency for the month
  const pastDaysWithTasks = days.filter((d) => !d.isFuture && d.totalTasks > 0);
  const greenDays = pastDaysWithTasks.filter((d) => d.status === "green").length;
  const monthConsistency =
    pastDaysWithTasks.length > 0 ? Math.round((greenDays / pastDaysWithTasks.length) * 100) : 0;

  return (
    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {monthLabel || format(new Date(), "MMMM yyyy")} Heatmap
        </span>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shadow-xs" />
            <span>≥80% Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block shadow-xs" />
            <span>&lt;80% Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-gray-200 inline-block" />
            <span>Future/Rest</span>
          </div>
        </div>
      </div>

      {/* Grid of days */}
      <div className="relative">
        <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1.5 sm:gap-2">
          {days.map((item) => {
            let bgClass = "bg-gray-200/70 border-gray-200 text-gray-400";
            if (item.status === "green") {
              bgClass = "bg-emerald-500 text-white border-emerald-600 shadow-xs shadow-emerald-500/20";
            } else if (item.status === "red") {
              bgClass = "bg-rose-500 text-white border-rose-600 shadow-xs shadow-rose-500/20";
            } else if (item.status === "empty") {
              bgClass = "bg-gray-100 border-gray-200/60 text-gray-400";
            }

            return (
              <div
                key={item.date}
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`relative h-8 sm:h-9 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all duration-150 cursor-pointer hover:scale-115 hover:z-20 ${bgClass}`}
              >
                {item.day}
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-gray-950 text-white text-xs py-1.5 px-3 rounded-xl shadow-xl border border-gray-800 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="font-bold">{hoveredDay.date}</span>
              <span>•</span>
              {hoveredDay.isFuture ? (
                <span className="text-gray-400">Upcoming day</span>
              ) : hoveredDay.totalTasks === 0 ? (
                <span className="text-gray-400">Rest day / No tasks scheduled</span>
              ) : (
                <span
                  className={
                    hoveredDay.status === "green" ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"
                  }
                >
                  {hoveredDay.completedTasks}/{hoveredDay.totalTasks} completed ({hoveredDay.completionRate}%)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          Monthly Success Days: <strong className="text-gray-900">{greenDays}</strong> / {pastDaysWithTasks.length} active days
        </span>
        <span>
          Consistency: <strong className="text-blue-600">{monthConsistency}%</strong>
        </span>
      </div>
    </div>
  );
}
