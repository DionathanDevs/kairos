import { Task, type TaskCategory, type TaskPriority } from '../../domain/entities/Task.js';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError.js';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  order_index: number;
  created_at: string;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

export class GetTasksUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(category?: TaskCategory, limit?: number, offset?: number): { tasks: TaskDTO[] } {
    const tasks = this.taskRepo.findAll(category, limit, offset);
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const weightDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.orderIndex - b.orderIndex;
    });

    return {
      tasks: sorted.map((t) => t.toJSON())
    };
  }
}

export class CreateTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(input: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
  }): TaskDTO {
    const nextOrder = this.taskRepo.getNextOrderIndex();
    const task = Task.create(
      input.title,
      input.description || '',
      input.priority || 'medium',
      input.category || 'personal',
      nextOrder
    );
    this.taskRepo.save(task);
    return task.toJSON();
  }
}

export class UpdateTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(input: {
    id: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
  }): TaskDTO {
    const task = this.taskRepo.findById(input.id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada.');
    }
    task.update(input.title, input.description || '', input.priority, input.category);
    this.taskRepo.save(task);
    return task.toJSON();
  }
}

export class ToggleTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(id: string): { completed: boolean } {
    const task = this.taskRepo.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada.');
    }
    const completed = task.toggleCompleted();
    this.taskRepo.save(task);
    return { completed };
  }
}

export class DeleteTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(id: string): boolean {
    const exists = this.taskRepo.findById(id);
    if (!exists) {
      throw new NotFoundError('Tarefa não encontrada.');
    }
    return this.taskRepo.delete(id);
  }
}

export class CompleteAllTasksUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(category: TaskCategory = 'personal'): { updatedCount: number } {
    if (category !== 'personal' && category !== 'work') {
      throw new ValidationError('Categoria inválida.');
    }
    const updatedCount = this.taskRepo.markAllCompleted(category);
    return { updatedCount };
  }
}

export class ClearCompletedTasksUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  public execute(category: TaskCategory = 'personal'): { deletedCount: number } {
    if (category !== 'personal' && category !== 'work') {
      throw new ValidationError('Categoria inválida.');
    }
    const deletedCount = this.taskRepo.clearCompleted(category);
    return { deletedCount };
  }
}
