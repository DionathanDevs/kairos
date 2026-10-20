import type { Task, TaskCategory } from '../entities/Task.js';

export interface ITaskRepository {
  findAll(category?: TaskCategory, limit?: number, offset?: number): Task[];
  findById(id: string): Task | null;
  save(task: Task): void;
  delete(id: string): boolean;
  getNextOrderIndex(): number;
  markAllCompleted(category: TaskCategory): number;
  clearCompleted(category: TaskCategory): number;
}
