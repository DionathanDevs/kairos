import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentTaskList } from './AgentTaskList';
import { NavigationMenu } from './NavigationMenu';
import type { AgentTask } from '../types';

describe('AgentTaskList & NavigationMenu AI Agent Tab', () => {
  const mockAgentTasks: AgentTask[] = [
    {
      id: 'aitask-1',
      title: 'Implementar rota de métricas',
      intent: 'Expor endpoint GET /api/metrics com latência e uso',
      description: 'Seguir Clean Architecture',
      acceptance_criteria: 'Testes Jest passando',
      repository_url: 'https://github.com/org/kairos',
      target_branch: 'main',
      priority: 'high',
      status: 'planning',
      artifact_url: '',
      agent_name: '',
      order_index: 0,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
      started_at: null,
      completed_at: null,
      logs: [
        {
          id: 'ailog-1',
          task_id: 'aitask-1',
          level: 'info',
          message: 'Tarefa registrada em fase de planejamento.',
          metadata: '',
          created_at: '2026-11-01T10:00:00Z'
        }
      ]
    },
    {
      id: 'aitask-2',
      title: 'Refatorar serviço de filas',
      intent: 'Garantir lock transacional SQLite',
      description: '',
      acceptance_criteria: 'Zero race conditions',
      repository_url: 'https://github.com/org/kairos-worker',
      target_branch: 'develop',
      priority: 'medium',
      status: 'in_review',
      artifact_url: 'https://github.com/org/kairos-worker/pull/55',
      agent_name: 'kairos-agent-01',
      order_index: 1,
      created_at: '2026-11-01T11:00:00Z',
      updated_at: '2026-11-01T11:30:00Z',
      started_at: '2026-11-01T11:05:00Z',
      completed_at: '2026-11-01T11:30:00Z',
      logs: []
    }
  ];

  it('renders AI agent tasks with intent, repository link, PR artifact link and action buttons', () => {
    const onMarkReady = vi.fn().mockResolvedValue(undefined);
    const onApproveReview = vi.fn().mockResolvedValue(undefined);

    render(
      <AgentTaskList
        tasks={mockAgentTasks}
        lang="pt"
        onEditTask={vi.fn()}
        onMarkReady={onMarkReady}
        onApproveReview={onApproveReview}
        onAppendLog={vi.fn().mockResolvedValue(undefined)}
        onCompleteWithArtifact={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText('Implementar rota de métricas')).toBeDefined();
    expect(screen.getByText('Expor endpoint GET /api/metrics com latência e uso')).toBeDefined();
    expect(screen.getByText('https://github.com/org/kairos')).toBeDefined();
    expect(screen.getByText('Abrir PR / Artefato')).toBeDefined();

    // Click 'Liberar p/ IA' on planning task
    const markReadyBtn = screen.getByText('Liberar p/ IA');
    fireEvent.click(markReadyBtn);
    expect(onMarkReady).toHaveBeenCalledWith('aitask-1');

    // Click 'Aprovar Revisão' on in_review task
    const approveBtn = screen.getByText('Aprovar Revisão');
    fireEvent.click(approveBtn);
    expect(onApproveReview).toHaveBeenCalledWith(mockAgentTasks[1]);
  });

  it('NavigationMenu allows selecting the AI Agent tab', () => {
    const onSelectTab = vi.fn();
    render(
      <NavigationMenu
        activeTab="agent"
        lang="pt"
        activeAgentTasksCount={2}
        onSelectTab={onSelectTab}
        onQuickAdd={vi.fn()}
      />
    );

    const agentBtns = screen.getAllByText('Agente IA');
    fireEvent.click(agentBtns[0]);
    expect(onSelectTab).toHaveBeenCalledWith('agent');
  });
});
