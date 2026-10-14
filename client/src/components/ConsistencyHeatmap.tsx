import React, { useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import type { HeatmapData, HeatmapDay, Language } from '../types';
import { translations } from '../i18n/translations';

interface ConsistencyHeatmapProps {
  data: HeatmapData | null;
  lang: Language;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ data, lang }) => {
  const t = translations[lang];
  const [hoveredDay, setHoveredDay] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

  if (!data || !data.weeks || data.weeks.length === 0) {
    return null;
  }

  // Get month label for each week if it marks the start of a month
  const monthLabels: { index: number; name: string }[] = [];
  let lastMonth = -1;

  data.weeks.forEach((week, wIdx) => {
    const firstDay = week[0];
    if (firstDay) {
      const [y, m, d] = firstDay.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const monthNum = dateObj.getMonth();
      if (monthNum !== lastMonth) {
        lastMonth = monthNum;
        monthLabels.push({
          index: wIdx,
          name: t.monthNames[monthNum]
        });
      }
    }
  });

  const getSquareColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#064e3b] hover:ring-1 hover:ring-emerald-400';
      case 2:
        return 'bg-[#047857] hover:ring-1 hover:ring-emerald-400';
      case 3:
        return 'bg-[#10b981] hover:ring-1 hover:ring-emerald-300 shadow-xs shadow-emerald-500/20';
      case 4:
        return 'bg-[#34d399] shadow-xs shadow-emerald-400/50 hover:ring-1 hover:ring-white';
      case 0:
      default:
        return 'bg-[#181b22] border border-[#232732] hover:border-gray-500';
    }
  };

  // 7 row indicators aligned directly with each day row (Monday to Sunday)
  const dayRowLabels = [
    t.dayLabels.Seg, // Mon (0)
    '',              // Tue (1)
    t.dayLabels.Qua, // Wed (2)
    '',              // Thu (3)
    t.dayLabels.Sex, // Fri (4)
    '',              // Sat (5)
    t.dayLabels.Dom  // Sun (6)
  ];

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
      {/* Background subtle glowing accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-300 tracking-wider uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-brand-green" />
              <span>{t.consistencyTracking}</span>
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.consistencyHistorySub}
          </p>
        </div>

        {/* Motivational Stats Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-bg/90 border border-dark-border text-gray-300 font-medium shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <strong className="text-brand-green font-bold">{data.totalActiveDays}</strong> {t.activeDays}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-dark-bg/90 border border-dark-border text-gray-300 font-medium shadow-inner">
            <strong className="text-brand-cyan font-bold">{data.completionRatePct}%</strong> {t.completionRate}
          </span>
        </div>
      </div>

      {/* Heatmap Grid (Scrollable on small mobile) */}
      <div className="overflow-x-auto scrollbar-thin pb-2 pt-2 relative z-10">
        <div className="min-w-[620px] inline-block">
          {/* Month labels row */}
          <div className="flex pl-9 mb-1.5 text-[11px] font-medium text-gray-400 select-none">
            {data.weeks.map((_, idx) => {
              const labelObj = monthLabels.find((m) => m.index === idx);
              return (
                <div key={`month-${idx}`} className="w-3.5 sm:w-4 mr-1">
                  {labelObj ? (
                    <span className="truncate">{labelObj.name}</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Grid rows */}
          <div className="flex">
            {/* Weekday indicators on the left (precisely aligned with each row) */}
            <div className="flex flex-col gap-1 sm:gap-1.5 pr-2.5 text-[10px] font-semibold text-gray-400 select-none text-right">
              {dayRowLabels.map((abbr, i) => (
                <div
                  key={`day-abbr-${i}`}
                  className="w-6 h-3.5 sm:h-4 flex items-center justify-end leading-none"
                >
                  <span>{abbr}</span>
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1 sm:gap-1.5">
              {data.weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1 sm:gap-1.5">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          day,
                          x: rect.left + rect.width / 2,
                          y: rect.top
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs sm:rounded-[3px] transition-all cursor-pointer ${getSquareColor(
                        day.level
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-dark-border/40 text-[11px] text-gray-400 relative z-10">
        <span>{t.less}</span>
        <div className="w-3 h-3 rounded-[2px] bg-[#181b22] border border-[#232732]" />
        <div className="w-3 h-3 rounded-[2px] bg-[#064e3b]" />
        <div className="w-3 h-3 rounded-[2px] bg-[#047857]" />
        <div className="w-3 h-3 rounded-[2px] bg-[#10b981]" />
        <div className="w-3 h-3 rounded-[2px] bg-[#34d399]" />
        <span>{t.more}</span>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
          className="z-50 pointer-events-none bg-dark-bg/95 backdrop-blur-sm border border-dark-border text-white text-xs px-2.5 py-1.5 rounded-lg shadow-2xl whitespace-nowrap flex flex-col items-center gap-0.5"
        >
          <div className="font-semibold text-brand-greenLight">
            {hoveredDay.day.count} / {hoveredDay.day.total} {lang === 'pt' ? 'hábitos concluídos' : 'habits completed'}
          </div>
          <div className="text-[10px] text-gray-400">
            {hoveredDay.day.date}
          </div>
        </div>
      )}
    </div>
  );
};

// Export as GitHubHeatmap as well for backward compatibility
export const GitHubHeatmap = ConsistencyHeatmap;
