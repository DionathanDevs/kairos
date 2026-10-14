import { StreakCalculator } from '../../../src/domain/services/StreakCalculator.js';
import { DateRangeService } from '../../../src/domain/services/DateRangeService.js';

describe('StreakCalculator Domain Service', () => {
  const refDate = new Date(2026, 9, 14); // Oct 14, 2026

  it('should return 0 streak if totalHabits is 0', () => {
    const streak = StreakCalculator.calculate(() => 4, 0, refDate);
    expect(streak).toBe(0);
  });

  it('should calculate streak including today if today is 100% completed', () => {
    const todayStr = DateRangeService.formatDate(refDate);
    const yesterdayStr = DateRangeService.getPastDate(refDate, 1);
    const twoDaysAgoStr = DateRangeService.getPastDate(refDate, 2);

    const completionMap: Record<string, number> = {
      [todayStr]: 4,
      [yesterdayStr]: 4,
      [twoDaysAgoStr]: 4
    };

    const streak = StreakCalculator.calculate(
      (d) => completionMap[d] ?? 0,
      4,
      refDate
    );

    expect(streak).toBe(3);
  });

  it('should maintain ongoing streak from yesterday if today is not yet 100%', () => {
    const todayStr = DateRangeService.formatDate(refDate);
    const yesterdayStr = DateRangeService.getPastDate(refDate, 1);
    const twoDaysAgoStr = DateRangeService.getPastDate(refDate, 2);

    const completionMap: Record<string, number> = {
      [todayStr]: 2, // in progress (2/4)
      [yesterdayStr]: 4,
      [twoDaysAgoStr]: 4
    };

    const streak = StreakCalculator.calculate(
      (d) => completionMap[d] ?? 0,
      4,
      refDate
    );

    expect(streak).toBe(2);
  });

  it('should return 0 if neither today nor yesterday was 100%', () => {
    const todayStr = DateRangeService.formatDate(refDate);
    const yesterdayStr = DateRangeService.getPastDate(refDate, 1);

    const completionMap: Record<string, number> = {
      [todayStr]: 2,
      [yesterdayStr]: 3 // not 100% (3/4)
    };

    const streak = StreakCalculator.calculate(
      (d) => completionMap[d] ?? 0,
      4,
      refDate
    );

    expect(streak).toBe(0);
  });
});
