export class ConsistencyCalculator {
  public static calculate(totalCompleted: number, totalHabits: number, daysCount: number = 7): number {
    if (totalHabits <= 0 || daysCount <= 0 || totalCompleted <= 0) {
      return 0;
    }
    const maxPossible = totalHabits * daysCount;
    return Math.min(100, Math.round((totalCompleted / maxPossible) * 100));
  }
}
