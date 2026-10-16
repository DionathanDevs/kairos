import React from 'react';
import { Check, Edit2 } from 'lucide-react';
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

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      <div className="overflow-x-auto scrollbar-thin">
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
          {habits.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhum hábito cadastrado ainda. Clique em "+ Novo Hábito" para começar!
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
