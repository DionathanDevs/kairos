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
