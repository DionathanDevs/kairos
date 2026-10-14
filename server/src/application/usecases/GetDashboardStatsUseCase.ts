import { DateRangeService } from '../../domain/services/DateRangeService.js';
import { ConsistencyCalculator } from '../../domain/services/ConsistencyCalculator.js';
import { StreakCalculator } from '../../domain/services/StreakCalculator.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';
import type { DashboardStatsDTO, DailySummaryDTO } from '../dtos/HabitDTOs.js';

export class GetDashboardStatsUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(referenceDate: Date = new Date()): DashboardStatsDTO {
    const totalHabits = this.habitRepo.count();
    const weekDays = DateRangeService.getCurrentWeekDates(referenceDate);
    const todayStr = DateRangeService.formatDate(referenceDate);

    if (totalHabits === 0) {
      return {
        perfectStreakDays: 0,
        weeklyConsistencyPct: 0,
        todayCompletedCount: 0,
        todayTotalCount: 0,
        todayDayName: weekDays.find((w) => w.isToday)?.name || 'Dom',
        weekDailySummary: weekDays.map((wd) => ({
          dayName: wd.name,
          date: wd.date,
          completedCount: 0,
          totalHabits: 0,
          percentage: 0,
          isToday: wd.isToday
        }))
      };
    }

    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    const countMap = this.habitLogRepo.findCompletedGroupedByDate(startDate, endDate);

    let totalWeekCompleted = 0;
    const weekDailySummary: DailySummaryDTO[] = weekDays.map((wd) => {
      const completedCount = countMap.get(wd.date) ?? 0;
      totalWeekCompleted += completedCount;
      const percentage = Math.round((completedCount / totalHabits) * 100);
      return {
        dayName: wd.name,
        date: wd.date,
        completedCount,
        totalHabits,
        percentage,
        isToday: wd.isToday
      };
    });

    const weeklyConsistencyPct = ConsistencyCalculator.calculate(totalWeekCompleted, totalHabits, 7);
    const todayCompletedCount = this.habitLogRepo.countCompletedOnDate(todayStr);

    const perfectStreakDays = StreakCalculator.calculate(
      (dateStr) => this.habitLogRepo.countCompletedOnDate(dateStr),
      totalHabits,
      referenceDate
    );

    const todayDayName = weekDays.find((w) => w.isToday)?.name || 'Dom';

    return {
      perfectStreakDays,
      weeklyConsistencyPct,
      todayCompletedCount,
      todayTotalCount: totalHabits,
      todayDayName,
      weekDailySummary
    };
  }
}
