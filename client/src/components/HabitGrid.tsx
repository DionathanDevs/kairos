import React, { useState } from 'react';
import { Check, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import type { HabitWithWeekLogs, Language } from '../types';
import { translations } from '../i18n/translations';

interface HabitGridProps {
  habits: HabitWithWeekLogs[];
  weekDays: { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[];
  lang: Language;
  onToggleDay: (habitId: string, date: string) => void;
  onEditHabit: (habit: HabitWithWeekLogs) => void;
}

export const HabitGrid: React.FC<HabitGridProps> = ({
  habits,
  weekDays,
  lang,
  onToggleDay,
  onEditHabit
}) => {
  const t = translations[lang];
  const [showAllDays, setShowAllDays] = useState(false);

  // Identify today's metadata
  const todayDay = weekDays.find((wd) => wd.isToday) || weekDays[weekDays.length - 1];
  const localizedTodayDayName = todayDay
    ? (t.dayLabels as Record<string, string>)[todayDay.name] || todayDay.name
    : '';

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      {habits.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {lang === 'pt'
            ? 'Nenhum hábito cadastrado ainda. Clique em "Novo Hábito" para começar!'
            : 'No habits tracked yet. Click "New Habit" to get started!'}
        </div>
      ) : showAllDays ? (
        /* Expanded Mode: Full 7-day week matrix with horizontal scroll */
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[580px] sm:min-w-[660px]">
            {/* Header Row */}
            <div className="grid grid-cols-12 items-center pb-4 mb-2 border-b border-dark-border/60 text-xs font-semibold text-gray-400 tracking-wider uppercase">
              <div className="col-span-5 sm:col-span-5 pl-1">
                {t.habitAndDailyGoal}
              </div>
              <div className="col-span-7 sm:col-span-7 grid grid-cols-7 text-center">
                {weekDays.map((wd) => {
                  const label = (t.dayLabels as Record<string, string>)[wd.name] || wd.name;
                  return (
                    <div
                      key={wd.name}
                      className={`flex flex-col items-center justify-center transition-colors ${
                        wd.isToday ? 'text-white font-bold' : 'text-gray-400'
                      }`}
                    >
                      <span>{label}</span>
                      {wd.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-0.5"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habit Rows */}
            <div className="divide-y divide-dark-border/40">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="grid grid-cols-12 items-center py-3.5 sm:py-4 group hover:bg-dark-cardHover/40 rounded-xl px-1 transition-colors"
                >
                  {/* Habit Info & Edit Trigger */}
                  <div
                    onClick={() => onEditHabit(habit)}
                    className="col-span-5 sm:col-span-5 pr-3 cursor-pointer select-none group/title"
                    title="Clique para editar este hábito"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm sm:text-base text-gray-100 group-hover/title:text-white transition-colors">
                        {habit.title}
                      </span>
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                    </div>
                    {habit.description && (
                      <p className="text-xs text-gray-400 font-normal truncate mt-0.5">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* 7 Daily Check Circles */}
                  <div className="col-span-7 sm:col-span-7 grid grid-cols-7 place-items-center">
                    {habit.days.map((day) => (
                      <button
                        key={day.date}
                        onClick={() => onToggleDay(habit.id, day.date)}
                        title={`${habit.title} - ${day.date} (${day.completed ? 'Concluído' : 'Pendente'})`}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                          day.completed
                            ? 'bg-brand-green text-black hover:bg-brand-greenLight animate-check-pop'
                            : 'bg-[#181b22] border border-[#262c38] text-transparent hover:border-gray-500 hover:bg-[#202530]'
                        }`}
                      >
                        {day.completed && (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] text-black" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Default Mode: Only Today shown for optimal mobile & desktop viewing */
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-dark-border/60 text-xs font-semibold text-gray-400 tracking-wider uppercase">
            <div className="pl-1">
              {t.habitAndDailyGoal}
            </div>
            <div className="flex items-center gap-1.5 pr-2 text-white font-bold">
              <span>{t.todayPrefix} ({localizedTodayDayName.toUpperCase()})</span>
              <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            </div>
          </div>

          {/* Habit Rows */}
          <div className="divide-y divide-dark-border/40">
            {habits.map((habit) => {
              const todayLog = habit.days.find((d) => d.date === todayDay?.date) || habit.days[habit.days.length - 1];
              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between py-3.5 sm:py-4 group hover:bg-dark-cardHover/40 rounded-xl px-1 sm:px-2 transition-colors"
                >
                  {/* Habit Info & Edit Trigger */}
                  <div
                    onClick={() => onEditHabit(habit)}
                    className="flex-1 pr-4 cursor-pointer select-none group/title min-w-0"
                    title="Clique para editar este hábito"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm sm:text-base text-gray-100 group-hover/title:text-white transition-colors truncate">
                        {habit.title}
                      </span>
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                    </div>
                    {habit.description && (
                      <p className="text-xs text-gray-400 font-normal truncate mt-0.5">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Single Today Check Circle */}
                  {todayLog && (
                    <div className="shrink-0 pr-1 sm:pr-2">
                      <button
                        onClick={() => onToggleDay(habit.id, todayLog.date)}
                        title={`${habit.title} - ${todayLog.date} (${todayLog.completed ? 'Concluído' : 'Pendente'})`}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                          todayLog.completed
                            ? 'bg-brand-green text-black hover:bg-brand-greenLight animate-check-pop'
                            : 'bg-[#181b22] border border-[#262c38] text-transparent hover:border-gray-500 hover:bg-[#202530]'
                        }`}
                      >
                        {todayLog.completed && (
                          <Check className="w-5 h-5 stroke-[3] text-black" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expand / Collapse Button below the grid */}
      {habits.length > 0 && (
        <button
          onClick={() => setShowAllDays((prev) => !prev)}
          className="w-full mt-3 pt-3 border-t border-dark-border/40 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-green transition-all py-2 rounded-xl hover:bg-dark-cardHover/30 active:scale-[0.99]"
        >
          {showAllDays ? (
            <>
              <ChevronUp className="w-4 h-4 text-brand-green" />
              <span>{t.showOnlyToday}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-brand-green" />
              <span>{t.expandAllDays}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
