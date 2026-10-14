export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export class HeatmapCalculator {
  public static calculateLevel(completedCount: number, totalHabits: number): HeatmapLevel {
    if (totalHabits <= 0 || completedCount <= 0) {
      return 0;
    }
    const ratio = completedCount / totalHabits;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }
}
