import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { HabitGrid } from './components/HabitGrid';
import { WeeklyChart } from './components/WeeklyChart';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';
import { HabitModal } from './components/HabitModal';
import { api } from './api/client';
import type { HabitWithWeekLogs, DashboardStats, HeatmapData, Habit, Language } from './types';
import { translations } from './i18n/translations';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('habit_tracker_lang') as Language) || 'pt';
  });

  const [habits, setHabits] = useState<HabitWithWeekLogs[]>([]);
  const [weekDays, setWeekDays] = useState<{ name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    perfectStreakDays: 0,
    weeklyConsistencyPct: 0,
    todayCompletedCount: 0,
    todayTotalCount: 0,
    todayDayName: 'Dom',
    weekDailySummary: []
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'pt' ? 'en' : 'pt';
    setLang(nextLang);
    localStorage.setItem('habit_tracker_lang', nextLang);
  };

  const loadData = useCallback(async () => {
    try {
      const [habitsRes, statsRes, heatmapRes] = await Promise.all([
        api.getHabits(),
        api.getStats(),
        api.getHeatmap(22)
      ]);
      setHabits(habitsRes.habits);
      setWeekDays(habitsRes.weekDays);
      setStats(statsRes);
      setHeatmapData(heatmapRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle toggling single day
  const handleToggleDay = async (habitId: string, date: string) => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          days: h.days.map((d) =>
            d.date === date ? { ...d, completed: !d.completed } : d
          )
        };
      })
    );

    try {
      await api.toggleHabit(habitId, date);
      // Refresh stats & heatmap in background
      const [statsRes, heatmapRes] = await Promise.all([
        api.getStats(),
        api.getHeatmap(22)
      ]);
      setStats(statsRes);
      setHeatmapData(heatmapRes);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      loadData(); // Revert on failure
    }
  };

  // Handle Mark All Today
  const handleMarkAllToday = async () => {
    try {
      setActionLoading(true);
      await api.markAllToday();
      await loadData();
      
      // Trigger festive confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#7dd3fc', '#ffffff']
      });

      showToast(translations[lang].modal.markAllSuccess);
    } catch (err) {
      console.error('Failed to mark all today:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Week
  const handleResetWeek = async () => {
    const t = translations[lang];
    if (!window.confirm(t.modal.confirmReset)) return;

    try {
      setActionLoading(true);
      await api.resetWeek();
      await loadData();
    } catch (err) {
      console.error('Failed to reset week:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open modal for new habit
  const handleOpenNewHabit = () => {
    setHabitToEdit(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing habit
  const handleEditHabit = (habit: HabitWithWeekLogs) => {
    setHabitToEdit(habit);
    setIsModalOpen(true);
  };

  // Save (Create or Update) Habit
  const handleSaveHabit = async (title: string, description: string, color: string) => {
    if (habitToEdit) {
      await api.updateHabit(habitToEdit.id, title, description, color);
    } else {
      await api.createHabit(title, description, color);
    }
    await loadData();
  };

  // Delete Habit
  const handleDeleteHabit = async (id: string) => {
    await api.deleteHabit(id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-gray-400">Carregando hábitos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 px-3 sm:px-6 py-4 sm:py-8 font-sans selection:bg-brand-green selection:text-black">
      {/* Toast message notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-brand-green text-black font-semibold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-4xl mx-auto">
        {/* Header with Title & Quick Actions */}
        <Header
          lang={lang}
          onToggleLang={toggleLanguage}
          onMarkAllToday={handleMarkAllToday}
          onResetWeek={handleResetWeek}
          onOpenNewHabit={handleOpenNewHabit}
          isActionLoading={actionLoading}
        />

        {/* 3 Metric Cards (Sequência Perfeita, Consistência, Hoje) */}
        <StatCards stats={stats} lang={lang} />

        {/* Motivational Consistency Heatmap (Front & Center) */}
        <ConsistencyHeatmap data={heatmapData} lang={lang} />

        {/* Habit Matrix with Weekdays & Green Circular Buttons */}
        <HabitGrid
          habits={habits}
          weekDays={weekDays}
          lang={lang}
          onToggleDay={handleToggleDay}
          onEditHabit={handleEditHabit}
        />

        {/* Weekly Bar Chart (Desempenho Diário da Semana) */}
        <WeeklyChart dailySummary={stats.weekDailySummary} lang={lang} />
      </main>

      {/* Habit Create / Edit Modal / Bottom Sheet */}
      <HabitModal
        isOpen={isModalOpen}
        habitToEdit={habitToEdit}
        lang={lang}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
}

export default App;
