import { DateRangeService } from '../../../src/domain/services/DateRangeService.js';

describe('DateRangeService Domain Service', () => {
  it('should format date correctly as YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 14); // Note: month is 0-indexed, so 9 is October
    expect(DateRangeService.formatDate(d)).toBe('2026-10-14');
  });

  it('should parse YYYY-MM-DD back to Date object', () => {
    const d = DateRangeService.parseDate('2026-10-14');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(14);
  });

  it('should calculate current week starting on Monday (Seg) and ending on Sunday (Dom)', () => {
    // 2026-10-14 is a Wednesday
    const wednesday = new Date(2026, 9, 14);
    const week = DateRangeService.getCurrentWeekDates(wednesday);

    expect(week).toHaveLength(7);
    expect(week[0].name).toBe('Seg');
    expect(week[0].date).toBe('2026-10-12'); // Monday
    expect(week[2].name).toBe('Qua');
    expect(week[2].date).toBe('2026-10-14'); // Wednesday (isToday = true)
    expect(week[2].isToday).toBe(true);
    expect(week[6].name).toBe('Dom');
    expect(week[6].date).toBe('2026-10-18'); // Sunday
  });
});
