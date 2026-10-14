import { HabitLog } from '../../domain/entities/HabitLog.js';
import { DateRangeService } from '../../domain/services/DateRangeService.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';

export class MarkAllTodayUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(referenceDate: Date = new Date()): { updatedCount: number } {
    const todayStr = DateRangeService.formatDate(referenceDate);
    const habits = this.habitRepo.findAll();

    const logsToSave = habits.map((h) => HabitLog.create(h.id, todayStr, true));
    this.habitLogRepo.saveBatch(logsToSave);

    return { updatedCount: habits.length };
  }
}
