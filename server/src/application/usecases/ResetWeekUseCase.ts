import { DateRangeService } from '../../domain/services/DateRangeService.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';

export class ResetWeekUseCase {
  constructor(private habitLogRepo: IHabitLogRepository) {}

  public execute(referenceDate: Date = new Date()): { resetCount: number } {
    const weekDays = DateRangeService.getCurrentWeekDates(referenceDate);
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;

    const resetCount = this.habitLogRepo.resetByDateRange(startDate, endDate);
    return { resetCount };
  }
}
