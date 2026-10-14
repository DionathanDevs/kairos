import { HabitLog } from '../../domain/entities/HabitLog.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';

export interface ToggleHabitLogInput {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export class ToggleHabitLogUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(input: ToggleHabitLogInput): { completed: boolean } {
    const habit = this.habitRepo.findById(input.habitId);
    if (!habit) {
      throw new NotFoundError(`Hábito com ID "${input.habitId}" não foi encontrado.`);
    }

    const existingLog = this.habitLogRepo.findByHabitAndDate(input.habitId, input.date);
    if (existingLog) {
      const newStatus = existingLog.toggle();
      this.habitLogRepo.save(existingLog);
      return { completed: newStatus };
    } else {
      const newLog = HabitLog.create(input.habitId, input.date, true);
      this.habitLogRepo.save(newLog);
      return { completed: true };
    }
  }
}
