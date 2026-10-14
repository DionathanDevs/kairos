import type { HabitLog } from '../entities/HabitLog.js';

export interface IHabitLogRepository {
  findByHabitAndDate(habitId: string, date: string): HabitLog | null;
  findByHabitAndDateRange(habitId: string, startDate: string, endDate: string): HabitLog[];
  findCompletedGroupedByDate(startDate: string, endDate: string): Map<string, number>;
  countCompletedOnDate(date: string): number;
  save(log: HabitLog): void;
  saveBatch(logs: HabitLog[]): void;
  deleteByHabitId(habitId: string): void;
  resetByDateRange(startDate: string, endDate: string): number;
}
