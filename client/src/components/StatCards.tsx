import React from 'react';
import type { DashboardStats, Language } from '../types';
import { translations } from '../i18n/translations';

interface StatCardsProps {
  stats: DashboardStats;
  lang: Language;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, lang }) => {
  const t = translations[lang];

  // Map today day name to current language
  const localizedTodayDayName = (t.dayLabels as Record<string, string>)[stats.todayDayName] || stats.todayDayName;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* 1. Sequência Perfeita */}
      <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-dark-subtle">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {t.perfectStreak}
        </span>
        <div className="my-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.perfectStreakDays}
          </span>
          <span className="text-base sm:text-lg font-bold text-gray-300">
            {t.daysUnit}
          </span>
        </div>
        <p className="text-xs text-gray-400 font-normal">
          {t.streakSub}
        </p>
      </div>

      {/* 2. Consistência */}
      <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-dark-subtle">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {t.consistency}
        </span>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.weeklyConsistencyPct}%
          </span>
        </div>
        <p className="text-xs text-gray-400 font-normal">
          {t.consistencySub}
        </p>
      </div>

      {/* 3. Hoje */}
      <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-dark-subtle">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {t.todayPrefix} ({localizedTodayDayName.toUpperCase()})
        </span>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {stats.todayCompletedCount}/{stats.todayTotalCount}
          </span>
        </div>
        <p className="text-xs text-gray-400 font-normal">
          {t.todaySub}
        </p>
      </div>
    </div>
  );
};
