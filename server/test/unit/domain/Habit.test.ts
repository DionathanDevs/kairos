import { Habit } from '../../../src/domain/entities/Habit.js';
import { ValidationError } from '../../../src/domain/errors/DomainError.js';

describe('Habit Domain Entity', () => {
  it('should successfully create a valid habit', () => {
    const habit = Habit.create('Academia', 'Treino hipertrofia / força (50 min)', '#10b981', 1);

    expect(habit.id).toBeDefined();
    expect(habit.title).toBe('Academia');
    expect(habit.description).toBe('Treino hipertrofia / força (50 min)');
    expect(habit.color).toBe('#10b981');
    expect(habit.orderIndex).toBe(1);
    expect(habit.createdAt).toBeDefined();
  });

  it('should throw ValidationError if title is empty or whitespace', () => {
    expect(() => Habit.create('')).toThrow(ValidationError);
    expect(() => Habit.create('   ')).toThrow(ValidationError);
  });

  it('should throw ValidationError if title exceeds 100 characters', () => {
    const longTitle = 'a'.repeat(101);
    expect(() => Habit.create(longTitle)).toThrow(ValidationError);
  });

  it('should update habit properties and trim strings', () => {
    const habit = Habit.create('Leitura', '10 páginas', '#10b981');
    habit.update('  Leitura Noturna  ', '  20 páginas  ', '#0ea5e9');

    expect(habit.title).toBe('Leitura Noturna');
    expect(habit.description).toBe('20 páginas');
    expect(habit.color).toBe('#0ea5e9');
  });

  it('should throw ValidationError when updating with invalid title', () => {
    const habit = Habit.create('Leitura');
    expect(() => habit.update('')).toThrow(ValidationError);
  });
});
