import type { Request, Response } from 'express';
import { DomainError, ValidationError, NotFoundError } from '../../domain/errors/DomainError.js';
import type { CreateHabitUseCase } from '../../application/usecases/CreateHabitUseCase.js';
import type { UpdateHabitUseCase } from '../../application/usecases/UpdateHabitUseCase.js';
import type { DeleteHabitUseCase } from '../../application/usecases/DeleteHabitUseCase.js';
import type { ToggleHabitLogUseCase } from '../../application/usecases/ToggleHabitLogUseCase.js';
import type { MarkAllTodayUseCase } from '../../application/usecases/MarkAllTodayUseCase.js';
import type { ResetWeekUseCase } from '../../application/usecases/ResetWeekUseCase.js';
import type { GetHabitsWithWeekUseCase } from '../../application/usecases/GetHabitsWithWeekUseCase.js';
import type { GetDashboardStatsUseCase } from '../../application/usecases/GetDashboardStatsUseCase.js';
import type { GetHeatmapUseCase } from '../../application/usecases/GetHeatmapUseCase.js';

export class HabitController {
  constructor(
    private getHabitsWithWeekUseCase: GetHabitsWithWeekUseCase,
    private getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private getHeatmapUseCase: GetHeatmapUseCase,
    private createHabitUseCase: CreateHabitUseCase,
    private updateHabitUseCase: UpdateHabitUseCase,
    private deleteHabitUseCase: DeleteHabitUseCase,
    private toggleHabitLogUseCase: ToggleHabitLogUseCase,
    private markAllTodayUseCase: MarkAllTodayUseCase,
    private resetWeekUseCase: ResetWeekUseCase
  ) {}

  public getHabits = (_req: Request, res: Response): void => {
    try {
      const data = this.getHabitsWithWeekUseCase.execute();
      res.json(data);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public getStats = (_req: Request, res: Response): void => {
    try {
      const data = this.getDashboardStatsUseCase.execute();
      res.json(data);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public getHeatmap = (req: Request, res: Response): void => {
    try {
      const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 20;
      const data = this.getHeatmapUseCase.execute(weeks);
      res.json(data);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public create = (req: Request, res: Response): void => {
    try {
      const { title, description, color } = req.body;
      const habit = this.createHabitUseCase.execute({ title, description, color });
      res.status(201).json(habit);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public update = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const { title, description, color } = req.body;
      const habit = this.updateHabitUseCase.execute({ id, title, description, color });
      res.json(habit);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public delete = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const success = this.deleteHabitUseCase.execute(id);
      res.json({ success });
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public toggle = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const { date } = req.body;
      if (!date) {
        res.status(400).json({ error: 'A data é obrigatória para alternar o status do hábito.' });
        return;
      }
      const result = this.toggleHabitLogUseCase.execute({ habitId: id, date });
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public markAllToday = (_req: Request, res: Response): void => {
    try {
      const result = this.markAllTodayUseCase.execute();
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public resetWeek = (_req: Request, res: Response): void => {
    try {
      const result = this.resetWeekUseCase.execute();
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
    console.error('[HabitController] Unexpected error:', err);
    res.status(500).json({ error: (err as any)?.message || 'Erro interno do servidor.' });
  }
}
