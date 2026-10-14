export interface WeekDayInfo {
  name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom';
  date: string; // YYYY-MM-DD
  isToday: boolean;
}

export class DateRangeService {
  public static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public static parseDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  public static getCurrentWeekDates(referenceDate: Date = new Date()): WeekDayInfo[] {
    const todayStr = this.formatDate(referenceDate);
    const dayOfWeek = referenceDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() + diffToMonday);

    const dayNames: ('Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom')[] = [
      'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
    ];

    return dayNames.map((name, i) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dateStr = this.formatDate(cur);
      return {
        name,
        date: dateStr,
        isToday: dateStr === todayStr
      };
    });
  }

  public static getPastDate(referenceDate: Date, daysAgo: number): string {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - daysAgo);
    return this.formatDate(d);
  }
}
