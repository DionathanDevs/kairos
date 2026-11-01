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
import { AgentTaskList } from './components/AgentTaskList';
import { AgentTaskModal } from './components/AgentTaskModal';
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
  TaskPriority,
  AgentTask,
  AgentTaskStatus,
  AgentTaskLogLevel
} from './types';
import { translations } from './i18n/translations';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('habit_tracker_lang') as Language) || 'pt';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('habits');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('personal');

  // Habits State
  const [habits, setHabits] = useState<HabitWithWeekLogs[]>([]);
  const [weekDays, setWeekDays] = useState<
    { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    perfectStreakDays: 0,
    weeklyConsistencyPct: 0,
    todayCompletedCount: 0,
    todayTotalCount: 0,
    todayDayName: 'Dom',
    weekDailySummary: []
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  // Tasks & Agent Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [agentTasksLoaded, setAgentTasksLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals State
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [showClearTasksConfirmModal, setShowClearTasksConfirmModal] = useState(false);

  const [isAgentTaskModalOpen, setIsAgentTaskModalOpen] = useState(false);
  const [agentTaskToEdit, setAgentTaskToEdit] = useState<AgentTask | null>(null);

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

  const loadTasks = useCallback(async () => {
    try {
      const tasksRes = await api.getTasks();
      setTasks(tasksRes.tasks);
      setTasksLoaded(true);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  const loadAgentTasks = useCallback(async () => {
    try {
      const res = await api.getAgentTasks();
      setAgentTasks(res.tasks);
      setAgentTasksLoaded(true);
    } catch (err) {
      console.error('Failed to load AI agent tasks:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'tasks' && !tasksLoaded) loadTasks();
    if (activeTab === 'agent' && !agentTasksLoaded) loadAgentTasks();
  }, [activeTab, tasksLoaded, agentTasksLoaded, loadTasks, loadAgentTasks]);

  // --- HABIT HANDLERS ---
  const handleToggleDay = async (habitId: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id !== habitId
          ? h
          : { ...h, days: h.days.map((d) => (d.date === date ? { ...d, completed: !d.completed } : d)) }
      )
    );
    try {
      await api.toggleHabit(habitId, date);
      const [statsRes, heatmapRes] = await Promise.all([api.getStats(), api.getHeatmap(22)]);
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
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#7dd3fc', '#ffffff'] });
      showToast(translations[lang].modal.markAllSuccess);
    } catch (err) {
      console.error('Failed to mark all today:', err);
    } finally {
      setActionLoading(false);
    }
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

  const handleSaveHabit = async (title: string, description: string, color: string) => {
    if (habitToEdit) await api.updateHabit(habitToEdit.id, title, description, color);
    else await api.createHabit(title, description, color);
    await loadData();
  };

  // --- TASK HANDLERS ---
  const handleSaveTask = async (title: string, description: string, priority: TaskPriority, category: TaskCategory) => {
    if (taskToEdit) await api.updateTask(taskToEdit.id, title, description, priority, category);
    else await api.createTask(title, description, priority, category);
    setTaskCategory(category);
    await loadTasks();
  };

  const handleToggleTask = async (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    try {
      await api.toggleTask(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      await loadTasks();
    }
  };

  const handleCompleteAllTasks = async () => {
    try {
      setActionLoading(true);
      await api.completeAllTasks(taskCategory);
      await loadTasks();
      confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#7dd3fc', '#ffffff'] });
      showToast(translations[lang].tasks.modal.completeAllSuccess);
    } catch (err) {
      console.error('Failed to complete all tasks:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteClearCompletedTasks = async () => {
    try {
      setActionLoading(true);
      await api.clearCompletedTasks(taskCategory);
      await loadTasks();
      setShowClearTasksConfirmModal(false);
      showToast(translations[lang].tasks.modal.clearCompletedSuccess);
    } catch (err) {
      console.error('Failed to clear completed tasks:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // --- AI AGENT TASK HANDLERS ---
  const handleSaveAgentTask = async (input: {
    title: string;
    intent: string;
    repository_url: string;
    target_branch: string;
    acceptance_criteria: string;
    description: string;
    priority: TaskPriority;
    status: AgentTaskStatus;
  }) => {
    if (agentTaskToEdit) await api.updateAgentTask(agentTaskToEdit.id, input);
    else await api.createAgentTask(input);
    await loadAgentTasks();
  };

  const handleMarkAgentTaskReady = async (taskId: string) => {
    await api.markAgentTaskReady(taskId);
    await loadAgentTasks();
    showToast(translations[lang].agentTasks.markedReadyToast);
  };

  const handleClaimNextAgentTask = async () => {
    try {
      setActionLoading(true);
      const res = await api.claimNextAgentTask('kairos-external-agent');
      await loadAgentTasks();
      showToast(
        res.task ? translations[lang].agentTasks.claimedToast : translations[lang].agentTasks.queueEmptyToast
      );
    } catch (err) {
      console.error('Failed to claim next AI task:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAgentTaskReview = async (task: AgentTask) => {
    await api.updateAgentTask(task.id, {
      title: task.title,
      intent: task.intent,
      repository_url: task.repository_url,
      target_branch: task.target_branch,
      acceptance_criteria: task.acceptance_criteria,
      description: task.description,
      priority: task.priority,
      status: 'completed',
      artifact_url: task.artifact_url
    });
    await loadAgentTasks();
  };

  const handleAppendAgentLog = async (
    taskId: string,
    level: AgentTaskLogLevel,
    message: string,
    markBlocked?: boolean
  ) => {
    await api.appendAgentTaskLog(taskId, { level, message, mark_blocked: markBlocked });
    await loadAgentTasks();
  };

  const handleCompleteWithArtifact = async (taskId: string, artifactUrl: string) => {
    await api.completeAgentTask(taskId, { artifact_url: artifactUrl, status: 'in_review' });
    await loadAgentTasks();
    showToast(translations[lang].agentTasks.completedToast);
  };

  const handleQuickAdd = () => {
    if (activeTab === 'habits') {
      setHabitToEdit(null);
      setIsHabitModalOpen(true);
    } else if (activeTab === 'tasks') {
      setTaskToEdit(null);
      setIsTaskModalOpen(true);
    } else {
      setAgentTaskToEdit(null);
      setIsAgentTaskModalOpen(true);
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const activeAgentTasksCount = agentTasks.filter((t) => t.status !== 'completed').length;

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
      {toastMessage && (
        <div className="fixed top-[max(1.25rem,env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 bg-brand-green text-black font-semibold text-xs sm:text-sm px-4 py-2 rounded-full animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-4xl mx-auto">
        <NavigationMenu
          activeTab={activeTab}
          lang={lang}
          pendingTasksCount={pendingTasksCount}
          activeAgentTasksCount={activeAgentTasksCount}
          onSelectTab={setActiveTab}
          onQuickAdd={handleQuickAdd}
        />

        <Header
          lang={lang}
          activeTab={activeTab}
          onToggleLang={toggleLanguage}
          onMarkAllToday={handleMarkAllToday}
          onResetWeek={() => setShowResetConfirmModal(true)}
          onOpenNewHabit={() => { setHabitToEdit(null); setIsHabitModalOpen(true); }}
          onCompleteAllTasks={handleCompleteAllTasks}
          onClearCompletedTasks={() => setShowClearTasksConfirmModal(true)}
          onOpenNewTask={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
          onOpenNewAgentTask={() => { setAgentTaskToEdit(null); setIsAgentTaskModalOpen(true); }}
          onClaimNextAgentTask={handleClaimNextAgentTask}
          onRefreshAgentTasks={loadAgentTasks}
          isActionLoading={actionLoading}
        />

        {activeTab === 'habits' ? (
          <>
            <div className="mt-6">
              <HabitGrid
                habits={habits}
                weekDays={weekDays}
                lang={lang}
                onToggleDay={handleToggleDay}
                onEditHabit={(habit) => { setHabitToEdit(habit); setIsHabitModalOpen(true); }}
              />
            </div>
            <ConsistencyHeatmap data={heatmapData} lang={lang} todayDate={weekDays.find((d) => d.isToday)?.date} />
            <StatCards stats={stats} lang={lang} />
            <WeeklyChart dailySummary={stats.weekDailySummary} lang={lang} />
          </>
        ) : activeTab === 'tasks' ? (
          <div className="mt-6">
            <TaskList
              tasks={tasks}
              activeCategory={taskCategory}
              lang={lang}
              onChangeCategory={setTaskCategory}
              onToggleTask={handleToggleTask}
              onEditTask={(task) => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
            />
          </div>
        ) : (
          <div className="mt-6">
            <AgentTaskList
              tasks={agentTasks}
              lang={lang}
              onEditTask={(task) => { setAgentTaskToEdit(task); setIsAgentTaskModalOpen(true); }}
              onMarkReady={handleMarkAgentTaskReady}
              onApproveReview={handleApproveAgentTaskReview}
              onAppendLog={handleAppendAgentLog}
              onCompleteWithArtifact={handleCompleteWithArtifact}
            />
          </div>
        )}
      </main>

      <HabitModal
        isOpen={isHabitModalOpen}
        habitToEdit={habitToEdit}
        lang={lang}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        onDelete={async (id) => { await api.deleteHabit(id); await loadData(); }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        defaultCategory={taskCategory}
        lang={lang}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={async (id) => { await api.deleteTask(id); await loadTasks(); }}
      />

      <AgentTaskModal
        isOpen={isAgentTaskModalOpen}
        taskToEdit={agentTaskToEdit}
        lang={lang}
        onClose={() => setIsAgentTaskModalOpen(false)}
        onSave={handleSaveAgentTask}
        onDelete={async (id) => { await api.deleteAgentTask(id); await loadAgentTasks(); }}
      />

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
