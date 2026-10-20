import React from 'react';
import { Plus, CheckCheck, RotateCcw, Globe } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';
import logoKairos from '../assets/logo-kairos.png';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onMarkAllToday: () => void;
  onResetWeek: () => void;
  onOpenNewHabit: () => void;
  isActionLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onMarkAllToday,
  onResetWeek,
  onOpenNewHabit,
  isActionLoading = false
}) => {
  const t = translations[lang];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-2 border-b border-dark-border">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={logoKairos}
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
        <p className="text-sm text-gray-400 mt-1 font-normal">
          {t.appSubtitle}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
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
      </div>
    </header>
  );
};
