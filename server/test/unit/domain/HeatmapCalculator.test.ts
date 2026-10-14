import { HeatmapCalculator } from '../../../src/domain/services/HeatmapCalculator.js';

describe('HeatmapCalculator Domain Service', () => {
  it('should return level 0 when 0 habits are completed or total is 0', () => {
    expect(HeatmapCalculator.calculateLevel(0, 4)).toBe(0);
    expect(HeatmapCalculator.calculateLevel(2, 0)).toBe(0);
  });

  it('should return level 1 for 1% - 25% ratio', () => {
    expect(HeatmapCalculator.calculateLevel(1, 4)).toBe(1); // 25%
  });

  it('should return level 2 for 26% - 50% ratio', () => {
    expect(HeatmapCalculator.calculateLevel(2, 4)).toBe(2); // 50%
  });

  it('should return level 3 for 51% - 75% ratio', () => {
    expect(HeatmapCalculator.calculateLevel(3, 4)).toBe(3); // 75%
  });

  it('should return level 4 for 76% - 100% ratio', () => {
    expect(HeatmapCalculator.calculateLevel(4, 4)).toBe(4); // 100%
  });
});
