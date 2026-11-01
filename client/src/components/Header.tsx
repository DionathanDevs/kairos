import React from 'react';
import { Plus, CheckCheck, RotateCcw, Trash2, Globe, Play, RefreshCw } from 'lucide-react';
import type { AppTab, Language } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  activeTab?: AppTab;
  onToggleLang: () => void;
  onMarkAllToday: () => void;
  onResetWeek: () => void;
  onOpenNewHabit: () => void;
  onCompleteAllTasks?: () => void;
  onClearCompletedTasks?: () => void;
  onOpenNewTask?: () => void;
  onOpenNewAgentTask?: () => void;
  onClaimNextAgentTask?: () => void;
  onRefreshAgentTasks?: () => void;
  isActionLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  activeTab = 'habits',
  onToggleLang,
  onMarkAllToday,
  onResetWeek,
  onOpenNewHabit,
  onCompleteAllTasks,
  onClearCompletedTasks,
  onOpenNewTask,
  onOpenNewAgentTask,
  onClaimNextAgentTask,
  onRefreshAgentTasks,
  isActionLoading = false
}) => {
  const t = translations[lang];
  const isTasks = activeTab === 'tasks';
  const isAgent = activeTab === 'agent';

  const subtitle = isAgent
    ? t.agentTasks.subtitle
    : isTasks
    ? t.tasks.subtitle
    : t.appSubtitle;

  return (
    <header className="mt-6 sm:mt-4 md:mt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-2 border-b border-dark-border">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-k-kairos.jpeg"
              alt="Kairos Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg drop-shadow"
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center">
              {t.appTitle}
            </h1>
          </div>
          <button
            onClick={onToggleLang}
            title={lang === 'pt' ? 'Mudar para Inglês' : 'Switch to Portuguese'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-brand-green/60 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-brand-green" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1 font-normal">{subtitle}</p>
      </div>

      {/* Contextual Action Buttons */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
        {isAgent ? (
          <>
            <button
              onClick={onRefreshAgentTasks}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-gray-500 text-gray-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-green" />
              <span>{t.agentTasks.refreshQueue}</span>
            </button>

            <button
              onClick={onClaimNextAgentTask}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-brand-green/60 text-gray-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-brand-green fill-current" />
              <span>{t.agentTasks.claimNextBtn}</span>
            </button>

            <button
              onClick={onOpenNewAgentTask}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.agentTasks.newAgentTask}</span>
            </button>
          </>
        ) : isTasks ? (
          <>
            <button
              onClick={onCompleteAllTasks}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-gray-500 text-gray-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-brand-green" />
              <span>{t.tasks.completeAll}</span>
            </button>

            <button
              onClick={onClearCompletedTasks}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-red-500/50 text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
              <span>{t.tasks.clearCompleted}</span>
            </button>

            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.tasks.newTask}</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onMarkAllToday}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-gray-500 text-gray-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-brand-green" />
              <span>{t.markAllToday}</span>
            </button>

            <button
              onClick={onResetWeek}
              disabled={isActionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full bg-dark-card border border-dark-border hover:border-red-500/50 text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
              <span>{t.resetWeek}</span>
            </button>

            <button
              onClick={onOpenNewHabit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.newHabit}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
