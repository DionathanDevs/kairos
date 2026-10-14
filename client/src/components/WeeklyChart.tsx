import React from 'react';
import type { DailySummary, Language } from '../types';
import { translations } from '../i18n/translations';

interface WeeklyChartProps {
  dailySummary: DailySummary[];
  lang: Language;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ dailySummary, lang }) => {
  const t = translations[lang];

  // Maximum habits value for y-axis scale (at least 4, or max total habits)
  const maxTotal = Math.max(4, ...dailySummary.map((d) => d.totalHabits));
  const yTicks = [4, 3, 2, 1, 0];

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-6">
        {t.dailyPerformance}
      </h3>

      <div className="relative pt-2 pb-2">
        {/* Chart area with Y-axis and bars */}
        <div className="flex h-44 sm:h-52">
          {/* Y-axis Labels */}
          <div className="flex flex-col justify-between items-end pr-3 pb-7 text-xs font-medium text-gray-400 select-none">
            {yTicks.map((val) => (
              <span key={val} className="leading-none">
                {val}
              </span>
            ))}
          </div>

          {/* Grid Lines + Bars Container */}
          <div className="flex-1 relative flex flex-col justify-between">
            {/* Background horizontal guide lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-7 pointer-events-none">
              {yTicks.map((val) => (
                <div
                  key={`line-${val}`}
                  className="w-full border-b border-dark-border/40"
                />
              ))}
            </div>

            {/* Bars container */}
            <div className="relative z-10 grid grid-cols-7 h-full items-end pb-7 gap-2 sm:gap-4 px-2 sm:px-6">
              {dailySummary.map((item) => {
                const heightPct = maxTotal > 0 ? (item.completedCount / maxTotal) * 100 : 0;
                const isMax = item.completedCount >= item.totalHabits && item.totalHabits > 0;
                
                // Color matches reference screenshot:
                // Full/perfect days are Emerald Green (#10b981)
                // Partial days are Soft Cyan / Light Blue (#93c5fd)
                const barColor = isMax ? 'bg-brand-green shadow-sm shadow-brand-green/30' : 'bg-brand-cyanLight';

                return (
                  <div
                    key={item.date}
                    className="flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-dark-bg border border-dark-border text-white text-[11px] font-medium px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                      {item.completedCount}/{item.totalHabits} ({item.percentage}%)
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[28px] sm:max-w-[34px] flex items-end justify-center h-full">
                      <div
                        style={{ height: `${Math.max(heightPct, 3)}%` }}
                        className={`w-full rounded-t-full transition-all duration-500 ease-out ${barColor} group-hover:brightness-110`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis Day Labels */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 px-2 sm:px-6 pt-2 border-t border-dark-border/40 text-center">
              {dailySummary.map((item) => {
                const label = (t.dayLabels as Record<string, string>)[item.dayName] || item.dayName;
                return (
                  <span
                    key={`label-${item.date}`}
                    className={`text-xs font-semibold transition-colors ${
                      item.isToday ? 'text-white font-bold' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
