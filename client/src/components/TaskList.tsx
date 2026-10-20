import React, { useState, useEffect } from 'react';
import { Check, Edit2, User, Briefcase, Flag, ChevronDown } from 'lucide-react';
import type { Task, TaskCategory, TaskPriority, Language } from '../types';
import { translations } from '../i18n/translations';

const PAGE_SIZE = 10;

interface TaskListProps {
  tasks: Task[];
  activeCategory: TaskCategory;
  lang: Language;
  onChangeCategory: (category: TaskCategory) => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { badge: string; dot: string }> = {
  high: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400'
  },
  medium: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400'
  },
  low: {
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400'
  }
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeCategory,
  lang,
  onChangeCategory,
  onToggleTask,
  onEditTask
}) => {
  const t = translations[lang];
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Reset pagination to 10 whenever the user switches category tabs
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  const personalCount = tasks.filter((item) => item.category === 'personal' && !item.completed).length;
  const workCount = tasks.filter((item) => item.category === 'work' && !item.completed).length;

  // Filter by selected category & sort: pending first -> high/medium/low -> order_index
  const filteredTasks = tasks
    .filter((item) => item.category === activeCategory)
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.order_index - b.order_index;
    });

  const visibleTasks = filteredTasks.slice(0, visibleCount);
  const hasMore = filteredTasks.length > visibleCount;

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      {/* Category Switcher (Pessoais | Trabalho) */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-dark-border/60">
        <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-grid bg-dark-bg p-1 rounded-xl border border-dark-border">
          <button
            type="button"
            onClick={() => onChangeCategory('personal')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'personal'
                ? 'bg-dark-card text-white border border-dark-border shadow-sm'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <User className={`w-4 h-4 ${activeCategory === 'personal' ? 'text-brand-green' : 'text-gray-400'}`} />
            <span>{t.tasks.personalTab}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeCategory === 'personal'
                  ? 'bg-brand-green/20 text-brand-green'
                  : 'bg-dark-cardHover text-gray-400'
              }`}
            >
              {personalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeCategory('work')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeCategory === 'work'
                ? 'bg-dark-card text-white border border-dark-border shadow-sm'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeCategory === 'work' ? 'text-brand-green' : 'text-gray-400'}`} />
            <span>{t.tasks.workTab}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeCategory === 'work'
                  ? 'bg-brand-green/20 text-brand-green'
                  : 'bg-dark-cardHover text-gray-400'
              }`}
            >
              {workCount}
            </span>
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {activeCategory === 'personal' ? t.tasks.emptyPersonal : t.tasks.emptyWork}
        </div>
      ) : (
        <div>
          {/* Header Row matching HabitGrid Today mode */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-dark-border/60 text-xs font-semibold text-gray-400 tracking-wider uppercase">
            <div className="pl-1">{t.tasks.taskAndPriorityHeader}</div>
            <div className="flex items-center gap-1.5 pr-2 text-white font-bold">
              <span>{t.tasks.statusHeader}</span>
              <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            </div>
          </div>

          {/* Task Rows (limited to visibleCount, incrementing by 10) */}
          <div className="divide-y divide-dark-border/40">
            {visibleTasks.map((task) => {
              const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
              const priorityLabel = t.tasks.priorities[task.priority];

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-3.5 sm:py-4 group hover:bg-dark-cardHover/40 rounded-xl px-1 sm:px-2 transition-colors"
                >
                  {/* Task Info, Priority Badge & Edit Trigger */}
                  <div
                    onClick={() => onEditTask(task)}
                    className="flex-1 pr-4 cursor-pointer select-none group/title min-w-0"
                    title={lang === 'pt' ? 'Clique para editar esta tarefa' : 'Click to edit this task'}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-semibold text-sm sm:text-base transition-colors truncate ${
                          task.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-100 group-hover/title:text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityStyle.badge} ${
                          task.completed ? 'opacity-50' : ''
                        }`}
                      >
                        <Flag className="w-2.5 h-2.5" />
                        <span>{priorityLabel}</span>
                      </span>

                      <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs font-normal truncate mt-0.5 ${
                          task.completed ? 'text-gray-600 line-through' : 'text-gray-400'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Single Check Circle matching HabitGrid */}
                  <div className="shrink-0 pr-1 sm:pr-2">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      title={`${task.title} (${task.completed ? 'Concluída' : 'Pendente'})`}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                        task.completed
                          ? 'bg-brand-green text-black hover:bg-brand-greenLight animate-check-pop'
                          : 'bg-[#181b22] border border-[#262c38] text-transparent hover:border-gray-500 hover:bg-[#202530]'
                      }`}
                    >
                      {task.completed && <Check className="w-5 h-5 stroke-[3] text-black" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 'Mostrar mais' button (loads 10 more items at a time) */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="w-full mt-3 pt-3 border-t border-dark-border/40 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-green transition-all py-2 rounded-xl hover:bg-dark-cardHover/30 active:scale-[0.99]"
            >
              <ChevronDown className="w-4 h-4 text-brand-green" />
              <span>{t.tasks.showMore}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
