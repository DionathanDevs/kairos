export interface DayStatus {
  dayName: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  date: string; // YYYY-MM-DD
  completed: boolean;
  isToday: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  color: string;
  order_index: number;
  created_at: string;
}

export interface HabitWithWeekLogs extends Habit {
  days: DayStatus[];
  weekCompletedCount: number;
}

export interface DailySummary {
  dayName: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  date: string;
  completedCount: number;
  totalHabits: number;
  percentage: number;
  isToday: boolean;
}

export interface DashboardStats {
  perfectStreakDays: number;
  weeklyConsistencyPct: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  todayDayName: string;
  weekDailySummary: DailySummary[];
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  total: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapData {
  weeks: HeatmapDay[][];
  totalActiveDays: number;
  completionRatePct: number;
}

export type Language = 'pt' | 'en';

export type AppTab = 'habits' | 'tasks' | 'agent';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'personal' | 'work';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  order_index: number;
  created_at: string;
}

export type AgentTaskStatus =
  | 'planning'
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'in_review'
  | 'completed';

export type AgentTaskLogLevel =
  | 'info'
  | 'progress'
  | 'error'
  | 'impediment'
  | 'artifact';

export interface AgentTaskLog {
  id: string;
  task_id: string;
  level: AgentTaskLogLevel;
  message: string;
  metadata: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  title: string;
  intent: string;
  description: string;
  acceptance_criteria: string;
  repository_url: string;
  target_branch: string;
  priority: TaskPriority;
  status: AgentTaskStatus;
  artifact_url: string;
  agent_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  logs: AgentTaskLog[];
}
