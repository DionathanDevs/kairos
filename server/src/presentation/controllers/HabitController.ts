import type { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../../domain/errors/DomainError.js';
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

  public getHabits = (_req: FastifyRequest, reply: FastifyReply): void => {
    const data = this.getHabitsWithWeekUseCase.execute();
    reply.send(data);
  };

  public getStats = (_req: FastifyRequest, reply: FastifyReply): void => {
    const data = this.getDashboardStatsUseCase.execute();
    reply.send(data);
  };

  public getHeatmap = (
    req: FastifyRequest<{ Querystring: { weeks?: string } }>,
    reply: FastifyReply
  ): void => {
    const weeks = req.query?.weeks ? parseInt(req.query.weeks, 10) : 20;
    const data = this.getHeatmapUseCase.execute(weeks);
    reply.send(data);
  };

  public create = (
    req: FastifyRequest<{ Body: { title?: string; description?: string; color?: string } }>,
    reply: FastifyReply
  ): void => {
    const { title = '', description, color } = req.body || {};
    const habit = this.createHabitUseCase.execute({ title, description, color });
    reply.code(201).send(habit);
  };

  public update = (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { title?: string; description?: string; color?: string };
    }>,
    reply: FastifyReply
  ): void => {
    const { id } = req.params;
    const { title = '', description, color } = req.body || {};
    const habit = this.updateHabitUseCase.execute({ id, title, description, color });
    reply.send(habit);
  };

  public delete = (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): void => {
    const { id } = req.params;
    const success = this.deleteHabitUseCase.execute(id);
    reply.send({ success });
  };

  public toggle = (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { date?: string };
    }>,
    reply: FastifyReply
  ): void => {
    const { id } = req.params;
    const { date } = req.body || {};
    if (!date) {
      throw new ValidationError('A data é obrigatória para alternar o status do hábito.');
    }
    const result = this.toggleHabitLogUseCase.execute({ habitId: id, date });
    reply.send(result);
  };

  public markAllToday = (_req: FastifyRequest, reply: FastifyReply): void => {
    const result = this.markAllTodayUseCase.execute();
    reply.send(result);
  };

  public resetWeek = (_req: FastifyRequest, reply: FastifyReply): void => {
    const result = this.resetWeekUseCase.execute();
    reply.send(result);
  };
}
