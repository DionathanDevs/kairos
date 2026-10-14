import { CreateHabitUseCase } from '../../../src/application/usecases/CreateHabitUseCase.js';
import type { IHabitRepository } from '../../../src/domain/repositories/IHabitRepository.js';
import type { Habit } from '../../../src/domain/entities/Habit.js';
import { ValidationError } from '../../../src/domain/errors/DomainError.js';

class InMemoryHabitRepository implements IHabitRepository {
  private habits: Map<string, Habit> = new Map();

  findAll(): Habit[] {
    return Array.from(this.habits.values());
  }
  findById(id: string): Habit | null {
    return this.habits.get(id) || null;
  }
  save(habit: Habit): void {
    this.habits.set(habit.id, habit);
  }
  delete(id: string): boolean {
    return this.habits.delete(id);
  }
  getNextOrderIndex(): number {
    return this.habits.size;
  }
  count(): number {
    return this.habits.size;
  }
}

describe('CreateHabitUseCase', () => {
  let habitRepo: InMemoryHabitRepository;
  let useCase: CreateHabitUseCase;

  beforeEach(() => {
    habitRepo = new InMemoryHabitRepository();
    useCase = new CreateHabitUseCase(habitRepo);
  });

  it('should create and persist a new habit', () => {
    const result = useCase.execute({
      title: 'Meditação',
      description: '15 min de mindfulness',
      color: '#10b981'
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Meditação');
    expect(result.description).toBe('15 min de mindfulness');
    expect(habitRepo.count()).toBe(1);
  });

  it('should reject creation with empty title', () => {
    expect(() => useCase.execute({ title: '' })).toThrow(ValidationError);
  });
});
