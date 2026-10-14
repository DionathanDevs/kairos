import { Habit } from '../../domain/entities/Habit.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';

export interface CreateHabitInput {
  title: string;
  description?: string;
  color?: string;
}

export class CreateHabitUseCase {
  constructor(private habitRepo: IHabitRepository) {}

  public execute(input: CreateHabitInput): ReturnType<Habit['toJSON']> {
    const nextOrder = this.habitRepo.getNextOrderIndex();
    const habit = Habit.create(input.title, input.description || '', input.color || '#10b981', nextOrder);
    this.habitRepo.save(habit);
    return habit.toJSON();
  }
}
