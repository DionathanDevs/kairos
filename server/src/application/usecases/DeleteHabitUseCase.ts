import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IHabitRepository } from '../../domain/repositories/IHabitRepository.js';
import type { IHabitLogRepository } from '../../domain/repositories/IHabitLogRepository.js';

export class DeleteHabitUseCase {
  constructor(
    private habitRepo: IHabitRepository,
    private habitLogRepo: IHabitLogRepository
  ) {}

  public execute(id: string): boolean {
    const habit = this.habitRepo.findById(id);
    if (!habit) {
      throw new NotFoundError(`Hábito com ID "${id}" não foi encontrado.`);
    }

    this.habitLogRepo.deleteByHabitId(id);
    return this.habitRepo.delete(id);
  }
}
