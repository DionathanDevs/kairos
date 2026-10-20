import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from './TaskList';
import { NavigationMenu } from './NavigationMenu';
import type { Task } from '../types';

describe('TaskList & NavigationMenu Components', () => {
  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Ir ao dentista',
      description: 'Consulta de rotina',
      priority: 'low',
      category: 'personal',
      completed: false,
      order_index: 0,
      created_at: '2026-10-20T10:00:00Z'
    },
    {
      id: 't2',
      title: 'Pagar fatura',
      description: 'Vence hoje',
      priority: 'high',
      category: 'personal',
      completed: false,
      order_index: 1,
      created_at: '2026-10-20T11:00:00Z'
    },
    {
      id: 't3',
      title: 'Revisar arquitetura da API',
      description: 'Alinhamento com o time',
      priority: 'medium',
      category: 'work',
      completed: false,
      order_index: 2,
      created_at: '2026-10-20T12:00:00Z'
    }
  ];

  it('renders personal tasks sorted by priority (High before Low) and shows priority tags', () => {
    render(
      <TaskList
        tasks={mockTasks}
        activeCategory="personal"
        lang="pt"
        onChangeCategory={vi.fn()}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
      />
    );

    expect(screen.getByText('Pagar fatura')).toBeDefined();
    expect(screen.getByText('Ir ao dentista')).toBeDefined();
    expect(screen.getByText('Alta')).toBeDefined();
    expect(screen.getByText('Baixa')).toBeDefined();

    // Work task should not be displayed when activeCategory is 'personal'
    expect(screen.queryByText('Revisar arquitetura da API')).toBeNull();
  });

  it('calls onChangeCategory when switching between Pessoais and Trabalho tabs', () => {
    const handleCategoryChange = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        activeCategory="personal"
        lang="pt"
        onChangeCategory={handleCategoryChange}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
      />
    );

    const workTabBtn = screen.getByText('Trabalho');
    fireEvent.click(workTabBtn);

    expect(handleCategoryChange).toHaveBeenCalledWith('work');
  });

  it('calls onToggleTask when check circle is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        activeCategory="work"
        lang="pt"
        onChangeCategory={vi.fn()}
        onToggleTask={handleToggle}
        onEditTask={vi.fn()}
      />
    );

    const checkBtn = screen.getByTitle('Revisar arquitetura da API (Pendente)');
    fireEvent.click(checkBtn);

    expect(handleToggle).toHaveBeenCalledWith('t3');
  });

  it('NavigationMenu switches tabs and triggers contextual quick add', () => {
    const handleSelectTab = vi.fn();
    const handleQuickAdd = vi.fn();

    render(
      <NavigationMenu
        activeTab="habits"
        lang="pt"
        pendingTasksCount={3}
        onSelectTab={handleSelectTab}
        onQuickAdd={handleQuickAdd}
      />
    );

    const tasksBtns = screen.getAllByText('Tarefas');
    fireEvent.click(tasksBtns[0]);
    expect(handleSelectTab).toHaveBeenCalledWith('tasks');

    const quickAddBtns = screen.getAllByTitle('Novo Hábito');
    fireEvent.click(quickAddBtns[0]);
    expect(handleQuickAdd).toHaveBeenCalled();
  });

  it('limits displayed tasks to 10 initially and loads 10 more when "Mostrar mais" is clicked', () => {
    const manyTasks: Task[] = Array.from({ length: 15 }, (_, idx) => ({
      id: `task-${idx + 1}`,
      title: `Tarefa Pessoal ${idx + 1}`,
      description: '',
      priority: 'medium',
      category: 'personal',
      completed: false,
      order_index: idx,
      created_at: '2026-10-20T10:00:00Z'
    }));

    render(
      <TaskList
        tasks={manyTasks}
        activeCategory="personal"
        lang="pt"
        onChangeCategory={vi.fn()}
        onToggleTask={vi.fn()}
        onEditTask={vi.fn()}
      />
    );

    // First 10 should be visible, 11th should not be rendered yet
    expect(screen.getByText('Tarefa Pessoal 1')).toBeDefined();
    expect(screen.getByText('Tarefa Pessoal 10')).toBeDefined();
    expect(screen.queryByText('Tarefa Pessoal 11')).toBeNull();

    // "Mostrar mais" button should be present
    const showMoreBtn = screen.getByText('Mostrar mais');
    fireEvent.click(showMoreBtn);

    // Now tasks 11..15 should be visible and "Mostrar mais" should disappear
    expect(screen.getByText('Tarefa Pessoal 11')).toBeDefined();
    expect(screen.getByText('Tarefa Pessoal 15')).toBeDefined();
    expect(screen.queryByText('Mostrar mais')).toBeNull();
  });
});

