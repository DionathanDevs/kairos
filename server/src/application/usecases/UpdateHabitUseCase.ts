import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { Habit } from '../../domain/entities/Habit.js';

export interface UpdateHabitInput {
  id: string;
  title: string;
  description?: string;
  color?: string;
}

export class UpdateHabitUseCase {
  constructor(private habitRepo: IHabitRepository) {}

  public execute(input: UpdateHabitInput): ReturnType<Habit['toJSON']> {
    const habit = this.habitRepo.findById(input.id);
    if (!habit) {
      throw new NotFoundError(`Hábito com ID "${input.id}" não foi encontrado.`);
    }

    habit.update(input.title, input.description || '', input.color);
    this.habitRepo.save(habit);
    return habit.toJSON();
  }
}
