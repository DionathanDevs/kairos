export interface DayStatusDTO {
  dayName: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  date: string;
  completed: boolean;
  isToday: boolean;
}

export interface HabitWithWeekLogsDTO {
  id: string;
  title: string;
  description: string;
  color: string;
  order_index: number;
  created_at: string;
  days: DayStatusDTO[];
  weekCompletedCount: number;
}

export interface DailySummaryDTO {
  dayName: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  date: string;
  completedCount: number;
  totalHabits: number;
  percentage: number;
  isToday: boolean;
}

export interface DashboardStatsDTO {
  perfectStreakDays: number;
  weeklyConsistencyPct: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  todayDayName: string;
  weekDailySummary: DailySummaryDTO[];
}

export interface HeatmapDayDTO {
  date: string;
  count: number;
  total: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapDataDTO {
  weeks: HeatmapDayDTO[][];
  totalActiveDays: number;
  completionRatePct: number;
}
