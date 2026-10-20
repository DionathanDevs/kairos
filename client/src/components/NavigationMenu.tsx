import React from 'react';
import { CalendarCheck2, ListTodo, Plus } from 'lucide-react';
import type { AppTab, Language } from '../types';
import { translations } from '../i18n/translations';

interface NavigationMenuProps {
  activeTab: AppTab;
  lang: Language;
  pendingTasksCount?: number;
  onSelectTab: (tab: AppTab) => void;
  onQuickAdd: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  activeTab,
  lang,
  pendingTasksCount = 0,
  onSelectTab,
  onQuickAdd
}) => {
  const t = translations[lang];
  const quickAddTitle = activeTab === 'habits' ? t.nav.quickAddHabit : t.nav.quickAddTask;

  const renderPillContent = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 rounded-full bg-dark-card/95 backdrop-blur-md border border-dark-border shadow-[0_10px_35px_rgba(0,0,0,0.65)]">
      {/* Habits Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('habits')}
        aria-current={activeTab === 'habits' ? 'page' : undefined}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
          activeTab === 'habits'
            ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-sm'
            : 'text-gray-400 hover:text-gray-200 hover:bg-dark-cardHover/60 border border-transparent'
        }`}
      >
        <CalendarCheck2
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors ${
            activeTab === 'habits' ? 'text-brand-green' : 'text-gray-400'
          }`}
        />
        <span>{t.nav.habits}</span>
      </button>

      {/* Center Contextual '+' Button */}
      <button
        type="button"
        onClick={onQuickAdd}
        title={quickAddTitle}
        aria-label={quickAddTitle}
        className="w-9 h-9 sm:w-10 sm:h-10 mx-0.5 rounded-full bg-brand-green text-black hover:bg-brand-greenLight flex items-center justify-center shadow-md shadow-brand-green/20 transition-all duration-200 active:scale-90 shrink-0"
      >
        <Plus className="w-5 h-5 stroke-[2.75]" />
      </button>

      {/* Tasks Tab */}
      <button
        type="button"
        onClick={() => onSelectTab('tasks')}
        aria-current={activeTab === 'tasks' ? 'page' : undefined}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
          activeTab === 'tasks'
            ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-sm'
            : 'text-gray-400 hover:text-gray-200 hover:bg-dark-cardHover/60 border border-transparent'
        }`}
      >
        <ListTodo
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors ${
            activeTab === 'tasks' ? 'text-brand-green' : 'text-gray-400'
          }`}
        />
        <span>{t.nav.tasks}</span>
        {pendingTasksCount > 0 && (
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'tasks'
                ? 'bg-brand-green text-black'
                : 'bg-dark-subtle text-gray-300'
            }`}
          >
            {pendingTasksCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Top Pill Navigation */}
      <nav
        aria-label="Desktop Navigation"
        className="hidden md:flex items-center justify-center mb-5"
      >
        {renderPillContent()}
      </nav>

      {/* Mobile Bottom Floating Pill Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40"
      >
        {renderPillContent()}
      </nav>
    </>
  );
};
