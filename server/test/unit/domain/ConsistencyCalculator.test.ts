import { ConsistencyCalculator } from '../../../src/domain/services/ConsistencyCalculator.js';

describe('ConsistencyCalculator Domain Service', () => {
  it('should calculate exactly 82% consistency for 23 completed out of 28 max (matching screenshot)', () => {
    // 4 habits across 7 days = 28 max possible.
    // 23 completed in week: 23 / 28 = 82.14% -> 82%
    const consistency = ConsistencyCalculator.calculate(23, 4, 7);
    expect(consistency).toBe(82);
  });

  it('should return 100% when all habits are completed', () => {
    const consistency = ConsistencyCalculator.calculate(28, 4, 7);
    expect(consistency).toBe(100);
  });

  it('should return 0% when no habits are completed', () => {
    const consistency = ConsistencyCalculator.calculate(0, 4, 7);
    expect(consistency).toBe(0);
  });

  it('should return 0% if totalHabits is 0 or negative', () => {
    expect(ConsistencyCalculator.calculate(10, 0, 7)).toBe(0);
    expect(ConsistencyCalculator.calculate(10, -1, 7)).toBe(0);
  });

  it('should return 0% if daysCount is 0 or negative', () => {
    expect(ConsistencyCalculator.calculate(10, 4, 0)).toBe(0);
  });
});
