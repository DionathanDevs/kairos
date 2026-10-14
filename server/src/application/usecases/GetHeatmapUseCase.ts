import { DateRangeService } from '../../domain/services/DateRangeService.js';
import { HeatmapCalculator } from '../../domain/services/HeatmapCalculator.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';
import type { HeatmapDataDTO, HeatmapDayDTO } from '../dtos/HabitDTOs.js';

export class GetHeatmapUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(weeksCount: number = 20, referenceDate: Date = new Date()): HeatmapDataDTO {
    const totalHabits = this.habitRepo.count();

    const currentWeekDays = DateRangeService.getCurrentWeekDates(referenceDate);
    const sunday = DateRangeService.parseDate(currentWeekDays[6].date);

    const totalDays = weeksCount * 7;
    const firstMonday = new Date(sunday);
    firstMonday.setDate(sunday.getDate() - totalDays + 1);

    const startStr = DateRangeService.formatDate(firstMonday);
    const endStr = DateRangeService.formatDate(sunday);

    const countMap = this.habitLogRepo.findCompletedGroupedByDate(startStr, endStr);

    const weeks: HeatmapDayDTO[][] = [];
    let curDate = new Date(firstMonday);
    let totalActiveDays = 0;
    let totalHabitCompletions = 0;

    for (let w = 0; w < weeksCount; w++) {
      const week: HeatmapDayDTO[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = DateRangeService.formatDate(curDate);
        const count = countMap.get(dateStr) ?? 0;

        if (totalHabits > 0 && count > 0) {
          totalActiveDays++;
          totalHabitCompletions += count;
        }

        const level = HeatmapCalculator.calculateLevel(count, totalHabits);

        week.push({
          date: dateStr,
          count,
          total: totalHabits,
          level
        });

        curDate.setDate(curDate.getDate() + 1);
      }
      weeks.push(week);
    }

    const totalPossible = totalDays * totalHabits;
    const completionRatePct = totalPossible > 0 ? Math.round((totalHabitCompletions / totalPossible) * 100) : 0;

    return {
      weeks,
      totalActiveDays,
      completionRatePct
    };
  }
}
