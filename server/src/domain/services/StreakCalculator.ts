import { DateRangeService } from './DateRangeService.js';

export class StreakCalculator {
  public static calculate(
    getCompletedCountForDate: (dateStr: string) => number,
    totalHabits: number,
    referenceDate: Date = new Date()
  ): number {
    if (totalHabits <= 0) return 0;

    const todayStr = DateRangeService.formatDate(referenceDate);
    const todayCompleted = getCompletedCountForDate(todayStr);

    let streak = 0;
    const checkDate = new Date(referenceDate);

    // If today is complete (100%), count today and continue checking backwards
    if (todayCompleted >= totalHabits) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today is not complete yet, check if yesterday was complete
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Traverse previous consecutive days
    for (let i = 0; i < 365; i++) {
      const curDateStr = DateRangeService.formatDate(checkDate);
      const dayCompleted = getCompletedCountForDate(curDateStr);

      if (dayCompleted >= totalHabits) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}
