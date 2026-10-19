import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitGrid } from './HabitGrid';
import type { HabitWithWeekLogs } from '../types';

describe('HabitGrid Component', () => {
  const mockWeekDays: { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[] = [
    { name: 'Seg', date: '2026-10-12', isToday: false },
    { name: 'Ter', date: '2026-10-13', isToday: false },
    { name: 'Qua', date: '2026-10-14', isToday: false },
    { name: 'Qui', date: '2026-10-15', isToday: false },
    { name: 'Sex', date: '2026-10-16', isToday: true },
    { name: 'Sáb', date: '2026-10-17', isToday: false },
    { name: 'Dom', date: '2026-10-18', isToday: false }
  ];

  const mockHabits: HabitWithWeekLogs[] = [
    {
      id: 'h1',
      title: 'Academia',
      description: 'Treino de hipertrofia',
      color: '#10b981',
      order_index: 0,
      created_at: '2026-10-01',
      weekCompletedCount: 3,
      days: [
        { date: '2026-10-12', dayName: 'Seg', completed: true, isToday: false },
        { date: '2026-10-13', dayName: 'Ter', completed: true, isToday: false },
        { date: '2026-10-14', dayName: 'Qua', completed: false, isToday: false },
        { date: '2026-10-15', dayName: 'Qui', completed: true, isToday: false },
        { date: '2026-10-16', dayName: 'Sex', completed: false, isToday: true },
        { date: '2026-10-17', dayName: 'Sáb', completed: false, isToday: false },
        { date: '2026-10-18', dayName: 'Dom', completed: false, isToday: false }
      ]
    }
  ];

  it('renders default view showing only today', () => {
    render(
      <HabitGrid
        habits={mockHabits}
        weekDays={mockWeekDays}
        lang="pt"
        onToggleDay={vi.fn()}
        onEditHabit={vi.fn()}
      />
    );

    // Expect habit title to be present
    expect(screen.getByText('Academia')).toBeDefined();

    // Expect header to show HOJE (SEX)
    expect(screen.getByText(/HOJE \(SEX\)/i)).toBeDefined();

    // Expect expand button to be visible
    expect(screen.getByText('Expandir todos os dias')).toBeDefined();

    // In default mode, weekday headers like 'Seg', 'Ter' should not be present in header
    expect(screen.queryByText('Seg')).toBeNull();
  });

  it('expands to show all 7 days when expand button is clicked', () => {
    render(
      <HabitGrid
        habits={mockHabits}
        weekDays={mockWeekDays}
        lang="pt"
        onToggleDay={vi.fn()}
        onEditHabit={vi.fn()}
      />
    );

    const expandBtn = screen.getByText('Expandir todos os dias');
    fireEvent.click(expandBtn);

    // Now all weekday headers should be rendered
    expect(screen.getByText('Seg')).toBeDefined();
    expect(screen.getByText('Ter')).toBeDefined();
    expect(screen.getByText('Qua')).toBeDefined();
    expect(screen.getByText('Qui')).toBeDefined();
    expect(screen.getByText('Sex')).toBeDefined();
    expect(screen.getByText('Sáb')).toBeDefined();
    expect(screen.getByText('Dom')).toBeDefined();

    // The button should now offer collapse
    expect(screen.getByText('Mostrar apenas hoje')).toBeDefined();
  });

  it('collapses back to showing only today when collapse button is clicked', () => {
    render(
      <HabitGrid
        habits={mockHabits}
        weekDays={mockWeekDays}
        lang="pt"
        onToggleDay={vi.fn()}
        onEditHabit={vi.fn()}
      />
    );

    // Expand
    fireEvent.click(screen.getByText('Expandir todos os dias'));
    expect(screen.getByText('Seg')).toBeDefined();

    // Collapse
    fireEvent.click(screen.getByText('Mostrar apenas hoje'));
    expect(screen.queryByText('Seg')).toBeNull();
    expect(screen.getByText(/HOJE \(SEX\)/i)).toBeDefined();
  });

  it('calls onToggleDay with habit id and today date when today circle is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <HabitGrid
        habits={mockHabits}
        weekDays={mockWeekDays}
        lang="pt"
        onToggleDay={handleToggle}
        onEditHabit={vi.fn()}
      />
    );

    // Button title in default mode is "Academia - 2026-10-16 (Pendente)"
    const checkBtn = screen.getByTitle('Academia - 2026-10-16 (Pendente)');
    fireEvent.click(checkBtn);

    expect(handleToggle).toHaveBeenCalledWith('h1', '2026-10-16');
  });

  it('calls onEditHabit when habit title area is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <HabitGrid
        habits={mockHabits}
        weekDays={mockWeekDays}
        lang="pt"
        onToggleDay={vi.fn()}
        onEditHabit={handleEdit}
      />
    );

    const titleEl = screen.getByText('Academia');
    fireEvent.click(titleEl);

    expect(handleEdit).toHaveBeenCalledWith(mockHabits[0]);
  });
});
