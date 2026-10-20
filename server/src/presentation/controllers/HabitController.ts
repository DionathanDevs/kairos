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

  public getHabits = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = this.getHabitsWithWeekUseCase.execute();
    return reply.send(data);
  };

  public getStats = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = this.getDashboardStatsUseCase.execute();
    return reply.send(data);
  };

  public getHeatmap = async (
    req: FastifyRequest<{ Querystring: { weeks?: string } }>,
    reply: FastifyReply
  ) => {
    const weeks = req.query?.weeks ? parseInt(req.query.weeks, 10) : 20;
    const data = this.getHeatmapUseCase.execute(weeks);
    return reply.send(data);
  };

  public create = async (
    req: FastifyRequest<{ Body: { title?: string; description?: string; color?: string } }>,
    reply: FastifyReply
  ) => {
    const { title = '', description, color } = req.body || {};
    const habit = this.createHabitUseCase.execute({ title, description, color });
    return reply.code(201).send(habit);
  };

  public update = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { title?: string; description?: string; color?: string };
    }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const { title = '', description, color } = req.body || {};
    const habit = this.updateHabitUseCase.execute({ id, title, description, color });
    return reply.send(habit);
  };

  public delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const success = this.deleteHabitUseCase.execute(id);
    return reply.send({ success });
  };

  public toggle = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { date?: string };
    }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const { date } = req.body || {};
    if (!date) {
      throw new ValidationError('A data é obrigatória para alternar o status do hábito.');
    }
    const result = this.toggleHabitLogUseCase.execute({ habitId: id, date });
    return reply.send(result);
  };

  public markAllToday = async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = this.markAllTodayUseCase.execute();
    return reply.send(result);
  };

  public resetWeek = async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = this.resetWeekUseCase.execute();
    return reply.send(result);
  };
}
