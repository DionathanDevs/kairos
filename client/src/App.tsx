import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { NavigationMenu } from './components/NavigationMenu';
import { StatCards } from './components/StatCards';
import { HabitGrid } from './components/HabitGrid';
import { WeeklyChart } from './components/WeeklyChart';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';
import { HabitModal } from './components/HabitModal';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { ConfirmModal } from './components/ConfirmModal';
import { api } from './api/client';
import type {
  HabitWithWeekLogs,
  DashboardStats,
  HeatmapData,
  Habit,
  Language,
  AppTab,
  Task,
  TaskCategory,
  TaskPriority
} from './types';
import { translations } from './i18n/translations';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('habit_tracker_lang') as Language) || 'pt';
  });

  // Navigation State (Initial tab: 'habits')
  const [activeTab, setActiveTab] = useState<AppTab>('habits');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('personal');

  // Habits State
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

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Habit Modal State
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [showClearTasksConfirmModal, setShowClearTasksConfirmModal] = useState(false);

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
      const [habitsRes, statsRes, heatmapRes, tasksRes] = await Promise.all([
        api.getHabits(),
        api.getStats(),
        api.getHeatmap(22),
        api.getTasks()
      ]);
      setHabits(habitsRes.habits);
      setWeekDays(habitsRes.weekDays);
      setStats(statsRes);
      setHeatmapData(heatmapRes);
      setTasks(tasksRes.tasks);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HABIT HANDLERS ---

  const handleToggleDay = async (habitId: string, date: string) => {
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
      const [statsRes, heatmapRes] = await Promise.all([
        api.getStats(),
        api.getHeatmap(22)
      ]);
      setStats(statsRes);
      setHeatmapData(heatmapRes);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      loadData();
    }
  };

  const handleMarkAllToday = async () => {
    try {
      setActionLoading(true);
      await api.markAllToday();
      await loadData();

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

  const handleResetWeek = () => {
    setShowResetConfirmModal(true);
  };

  const handleExecuteResetWeek = async () => {
    try {
      setActionLoading(true);
      await api.resetWeek();
      await loadData();
      setShowResetConfirmModal(false);
    } catch (err) {
      console.error('Failed to reset week:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenNewHabit = () => {
    setHabitToEdit(null);
    setIsHabitModalOpen(true);
  };

  const handleEditHabit = (habit: HabitWithWeekLogs) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = async (title: string, description: string, color: string) => {
    if (habitToEdit) {
      await api.updateHabit(habitToEdit.id, title, description, color);
    } else {
      await api.createHabit(title, description, color);
    }
    await loadData();
  };

  const handleDeleteHabit = async (id: string) => {
    await api.deleteHabit(id);
    await loadData();
  };

  // --- TASK HANDLERS ---

  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (
    title: string,
    description: string,
    priority: TaskPriority,
    category: TaskCategory
  ) => {
    if (taskToEdit) {
      await api.updateTask(taskToEdit.id, title, description, priority, category);
    } else {
      await api.createTask(title, description, priority, category);
    }
    setTaskCategory(category);
    const tasksRes = await api.getTasks();
    setTasks(tasksRes.tasks);
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    const tasksRes = await api.getTasks();
    setTasks(tasksRes.tasks);
  };

  const handleToggleTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );

    try {
      await api.toggleTask(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      const tasksRes = await api.getTasks();
      setTasks(tasksRes.tasks);
    }
  };

  const handleCompleteAllTasks = async () => {
    try {
      setActionLoading(true);
      await api.completeAllTasks(taskCategory);
      const tasksRes = await api.getTasks();
      setTasks(tasksRes.tasks);

      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#7dd3fc', '#ffffff']
      });

      showToast(translations[lang].tasks.modal.completeAllSuccess);
    } catch (err) {
      console.error('Failed to complete all tasks:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCompletedTasks = () => {
    setShowClearTasksConfirmModal(true);
  };

  const handleExecuteClearCompletedTasks = async () => {
    try {
      setActionLoading(true);
      await api.clearCompletedTasks(taskCategory);
      const tasksRes = await api.getTasks();
      setTasks(tasksRes.tasks);
      setShowClearTasksConfirmModal(false);
      showToast(translations[lang].tasks.modal.clearCompletedSuccess);
    } catch (err) {
      console.error('Failed to clear completed tasks:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Add from Navigation Menu '+' button
  const handleQuickAdd = () => {
    if (activeTab === 'habits') {
      handleOpenNewHabit();
    } else {
      handleOpenNewTask();
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

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
    <div className="min-h-screen bg-dark-bg text-gray-100 safe-area-container pb-28 md:pb-10 font-sans selection:bg-brand-green selection:text-black">
      {/* Toast message notification */}
      {toastMessage && (
        <div className="fixed top-[max(1.25rem,env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 bg-brand-green text-black font-semibold text-xs sm:text-sm px-4 py-2 rounded-full animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-4xl mx-auto">
        {/* Pill Navigation Menu (Top on Desktop, Fixed Bottom on Mobile) */}
        <NavigationMenu
          activeTab={activeTab}
          lang={lang}
          pendingTasksCount={pendingTasksCount}
          onSelectTab={setActiveTab}
          onQuickAdd={handleQuickAdd}
        />

        {/* Header with Title & Contextual Quick Actions */}
        <Header
          lang={lang}
          activeTab={activeTab}
          onToggleLang={toggleLanguage}
          onMarkAllToday={handleMarkAllToday}
          onResetWeek={handleResetWeek}
          onOpenNewHabit={handleOpenNewHabit}
          onCompleteAllTasks={handleCompleteAllTasks}
          onClearCompletedTasks={handleClearCompletedTasks}
          onOpenNewTask={handleOpenNewTask}
          isActionLoading={actionLoading}
        />

        {activeTab === 'habits' ? (
          <>
            {/* 1. Habit Matrix with Weekdays & Green Circular Buttons */}
            <div className="mt-6">
              <HabitGrid
                habits={habits}
                weekDays={weekDays}
                lang={lang}
                onToggleDay={handleToggleDay}
                onEditHabit={handleEditHabit}
              />
            </div>

            {/* 2. Motivational Consistency Heatmap (CONSISTENCY HISTORY) */}
            <ConsistencyHeatmap
              data={heatmapData}
              lang={lang}
              todayDate={weekDays.find((d) => d.isToday)?.date}
            />

            {/* 3. Metric Cards (Sequência Perfeita, Consistência, Hoje) */}
            <StatCards stats={stats} lang={lang} />

            {/* 4. Weekly Bar Chart (Desempenho Diário da Semana / Completed Habits) */}
            <WeeklyChart dailySummary={stats.weekDailySummary} lang={lang} />
          </>
        ) : (
          /* Tasks Tab: Follows HabitGrid reference without mirroring GitHub consistency or extra analytics */
          <div className="mt-6">
            <TaskList
              tasks={tasks}
              activeCategory={taskCategory}
              lang={lang}
              onChangeCategory={setTaskCategory}
              onToggleTask={handleToggleTask}
              onEditTask={handleEditTask}
            />
          </div>
        )}
      </main>

      {/* Habit Create / Edit Modal / Bottom Sheet */}
      <HabitModal
        isOpen={isHabitModalOpen}
        habitToEdit={habitToEdit}
        lang={lang}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />

      {/* Task Create / Edit Modal / Bottom Sheet */}
      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        defaultCategory={taskCategory}
        lang={lang}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Confirmation Modal for Resetting Current Week */}
      <ConfirmModal
        isOpen={showResetConfirmModal}
        title={lang === 'pt' ? 'Resetar Semana' : 'Reset Week'}
        message={translations[lang].modal.confirmReset}
        confirmLabel={lang === 'pt' ? 'Sim, Resetar' : 'Yes, Reset'}
        cancelLabel={translations[lang].modal.cancel}
        isDestructive={true}
        isLoading={actionLoading}
        onConfirm={handleExecuteResetWeek}
        onCancel={() => setShowResetConfirmModal(false)}
      />

      {/* Confirmation Modal for Clearing Completed Tasks */}
      <ConfirmModal
        isOpen={showClearTasksConfirmModal}
        title={translations[lang].tasks.modal.confirmClearTitle}
        message={translations[lang].tasks.modal.confirmClearMsg}
        confirmLabel={lang === 'pt' ? 'Sim, Limpar' : 'Yes, Clear'}
        cancelLabel={translations[lang].modal.cancel}
        isDestructive={true}
        isLoading={actionLoading}
        onConfirm={handleExecuteClearCompletedTasks}
        onCancel={() => setShowClearTasksConfirmModal(false)}
      />
    </div>
  );
}

export default App;
