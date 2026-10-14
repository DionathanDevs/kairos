import type { Habit } from '../entities/Habit.js';

export interface IHabitRepository {
  findAll(): Habit[];
  findById(id: string): Habit | null;
  save(habit: Habit): void;
  delete(id: string): boolean;
  getNextOrderIndex(): number;
  count(): number;
}
