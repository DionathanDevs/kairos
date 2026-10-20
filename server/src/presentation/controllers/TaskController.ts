import type { Request, Response } from 'express';
import { DomainError, ValidationError, NotFoundError } from '../../domain/errors/DomainError.js';
import type { TaskCategory, TaskPriority } from '../../domain/entities/Task.js';
import type {
  GetTasksUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  ToggleTaskUseCase,
  DeleteTaskUseCase,
  CompleteAllTasksUseCase,
  ClearCompletedTasksUseCase
} from '../../application/usecases/TaskUseCases.js';

export class TaskController {
  constructor(
    private getTasksUseCase: GetTasksUseCase,
    private createTaskUseCase: CreateTaskUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private toggleTaskUseCase: ToggleTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase,
    private completeAllTasksUseCase: CompleteAllTasksUseCase,
    private clearCompletedTasksUseCase: ClearCompletedTasksUseCase
  ) {}

  public getTasks = (req: Request, res: Response): void => {
    try {
      const category = req.query.category as TaskCategory | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const data = this.getTasksUseCase.execute(category, limit, offset);
      res.json(data);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public create = (req: Request, res: Response): void => {
    try {
      const { title = '', description, priority, category } = req.body || {};
      const task = this.createTaskUseCase.execute({ title, description, priority, category });
      res.status(201).json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public update = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const { title = '', description, priority, category } = req.body || {};
      const task = this.updateTaskUseCase.execute({ id, title, description, priority, category });
      res.json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public toggle = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const result = this.toggleTaskUseCase.execute(id);
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public delete = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const success = this.deleteTaskUseCase.execute(id);
      res.json({ success });
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public completeAll = (req: Request, res: Response): void => {
    try {
      const category = (req.body?.category as TaskCategory) || 'personal';
      const result = this.completeAllTasksUseCase.execute(category);
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public clearCompleted = (req: Request, res: Response): void => {
    try {
      const category = (req.body?.category as TaskCategory) || 'personal';
      const result = this.clearCompletedTasksUseCase.execute(category);
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  private handleError(err: unknown, res: Response): void {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof DomainError) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error('[TaskController] Unexpected error:', err);
    res.status(500).json({ error: (err as any)?.message || 'Erro interno do servidor.' });
  }
}
