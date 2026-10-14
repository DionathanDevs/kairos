import { ToggleHabitLogUseCase } from '../../../src/application/usecases/ToggleHabitLogUseCase.js';
import { Habit } from '../../../src/domain/entities/Habit.js';
import { HabitLog } from '../../../src/domain/entities/HabitLog.js';
import { NotFoundError } from '../../../src/domain/errors/DomainError.js';
import type { IHabitRepository } from '../../../src/domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../../src/domain/repositories/IHabitLogRepository.js';

class MockHabitRepo implements IHabitRepository {
  public habits = new Map<string, Habit>();
  findAll() { return Array.from(this.habits.values()); }
  findById(id: string) { return this.habits.get(id) || null; }
  save(h: Habit) { this.habits.set(h.id, h); }
  delete(id: string) { return this.habits.delete(id); }
  getNextOrderIndex() { return this.habits.size; }
  count() { return this.habits.size; }
}

class MockHabitLogRepo implements IHabitLogRepository {
  public logs = new Map<string, HabitLog>();
  findByHabitAndDate(habitId: string, date: string) {
    return this.logs.get(`${habitId}_${date}`) || null;
  }
  findByHabitAndDateRange(habitId: string, _s: string, _e: string) {
    return Array.from(this.logs.values()).filter((l) => l.habitId === habitId);
  }
  findCompletedGroupedByDate(_s: string, _e: string) {
    const map = new Map<string, number>();
    for (const l of this.logs.values()) {
      if (l.completed) {
        map.set(l.date, (map.get(l.date) || 0) + 1);
      }
    }
    return map;
  }
  countCompletedOnDate(date: string) {
    let count = 0;
    for (const l of this.logs.values()) {
      if (l.date === date && l.completed) count++;
    }
    return count;
  }
  save(log: HabitLog) {
    this.logs.set(log.id, log);
  }
  saveBatch(logs: HabitLog[]) {
    for (const l of logs) this.logs.set(l.id, l);
  }
  deleteByHabitId(habitId: string) {
    for (const [k, v] of this.logs.entries()) {
      if (v.habitId === habitId) this.logs.delete(k);
    }
  }
  resetByDateRange(_s: string, _e: string) {
    let count = 0;
    for (const l of this.logs.values()) {
      if (l.completed) {
        l.setCompleted(false);
        count++;
      }
    }
    return count;
  }
}

describe('ToggleHabitLogUseCase', () => {
  let habitRepo: MockHabitRepo;
  let habitLogRepo: MockHabitLogRepo;
  let useCase: ToggleHabitLogUseCase;

  beforeEach(() => {
    habitRepo = new MockHabitRepo();
    habitLogRepo = new MockHabitLogRepo();
    useCase = new ToggleHabitLogUseCase(habitRepo, habitLogRepo);
  });

  it('should toggle habit log to true when no previous log exists', () => {
    const habit = Habit.create('Correr 5km');
    habitRepo.save(habit);

    const result = useCase.execute({ habitId: habit.id, date: '2026-10-14' });
    expect(result.completed).toBe(true);

    const savedLog = habitLogRepo.findByHabitAndDate(habit.id, '2026-10-14');
    expect(savedLog?.completed).toBe(true);
  });

  it('should toggle habit log from true to false when previously completed', () => {
    const habit = Habit.create('Correr 5km');
    habitRepo.save(habit);

    // Initial state: true
    useCase.execute({ habitId: habit.id, date: '2026-10-14' });

    // Second toggle: false
    const result = useCase.execute({ habitId: habit.id, date: '2026-10-14' });
    expect(result.completed).toBe(false);

    const savedLog = habitLogRepo.findByHabitAndDate(habit.id, '2026-10-14');
    expect(savedLog?.completed).toBe(false);
  });

  it('should throw NotFoundError if habit does not exist', () => {
    expect(() =>
      useCase.execute({ habitId: 'non-existent-id', date: '2026-10-14' })
    ).toThrow(NotFoundError);
  });
});
