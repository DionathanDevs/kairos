import { AgentTask } from '../../../src/domain/entities/AgentTask.js';
import { AgentTaskLog } from '../../../src/domain/entities/AgentTaskLog.js';
import { DomainError, ValidationError } from '../../../src/domain/errors/DomainError.js';

describe('AgentTask & AgentTaskLog Domain Entities', () => {
  it('should create an AgentTask in planning status by default', () => {
    const task = AgentTask.create({
      title: 'Implementar endpoint de métricas',
      intent: 'Adicionar rota GET /api/metrics com resumo de execução',
      repositoryUrl: 'https://github.com/org/kairos',
      acceptanceCriteria: 'Deve retornar status 200 e payload JSON tipado',
      targetBranch: 'main',
      priority: 'high'
    });

    expect(task.id).toMatch(/^aitask-/);
    expect(task.title).toBe('Implementar endpoint de métricas');
    expect(task.intent).toBe('Adicionar rota GET /api/metrics com resumo de execução');
    expect(task.repositoryUrl).toBe('https://github.com/org/kairos');
    expect(task.status).toBe('planning');
    expect(task.priority).toBe('high');
  });

  it('should throw ValidationError when title, intent or repositoryUrl are empty', () => {
    expect(() =>
      AgentTask.create({
        title: '   ',
        intent: 'Intenção válida',
        repositoryUrl: 'org/repo'
      })
    ).toThrow(ValidationError);

    expect(() =>
      AgentTask.create({
        title: 'Título válido',
        intent: '',
        repositoryUrl: 'org/repo'
      })
    ).toThrow(ValidationError);

    expect(() =>
      AgentTask.create({
        title: 'Título válido',
        intent: 'Intenção válida',
        repositoryUrl: '   '
      })
    ).toThrow(ValidationError);
  });

  it('should transition through lifecycle: planning -> ready -> in_progress -> blocked -> ready -> in_review -> completed', () => {
    const task = AgentTask.create({
      title: 'Refatorar parser de mensagens',
      intent: 'Extrair suporte a tags de repositório',
      repositoryUrl: 'https://github.com/org/kairos'
    });

    expect(task.status).toBe('planning');

    // 1. Mark ready for automation
    task.markReady();
    expect(task.status).toBe('ready');

    // 2. External agent claims the task
    task.claim('autonomous-worker-01');
    expect(task.status).toBe('in_progress');
    expect(task.agentName).toBe('autonomous-worker-01');
    expect(task.startedAt).toBeTruthy();

    // Cannot claim a task that is already in_progress
    expect(() => task.claim('autonomous-worker-02')).toThrow(DomainError);

    // 3. External agent reports impediment
    task.markBlocked();
    expect(task.status).toBe('blocked');

    // Human resolves impediment and marks ready again
    task.markReady();
    expect(task.status).toBe('ready');
    task.claim('autonomous-worker-01');

    // 4. Complete with artifact (PR link)
    task.completeWithArtifact('https://github.com/org/kairos/pull/42', 'in_review');
    expect(task.status).toBe('in_review');
    expect(task.artifactUrl).toBe('https://github.com/org/kairos/pull/42');
    expect(task.completedAt).toBeTruthy();

    // Human approves review
    task.approveReview();
    expect(task.status).toBe('completed');
  });

  it('should validate artifactUrl when completing an AgentTask', () => {
    const task = AgentTask.create({
      title: 'Corrigir bug no filtro',
      intent: 'Ajustar query SQL',
      repositoryUrl: 'org/kairos',
      status: 'in_progress'
    });

    expect(() => task.completeWithArtifact('   ')).toThrow(ValidationError);
  });

  it('should create and validate AgentTaskLog entries', () => {
    const log = AgentTaskLog.create({
      taskId: 'aitask-123',
      level: 'progress',
      message: 'Clonando repositório e executando suíte de testes...',
      metadata: 'branch: feat/ai-tasks'
    });

    expect(log.id).toMatch(/^ailog-/);
    expect(log.level).toBe('progress');
    expect(log.toJSON()).toEqual(
      expect.objectContaining({
        task_id: 'aitask-123',
        level: 'progress',
        message: 'Clonando repositório e executando suíte de testes...'
      })
    );

    expect(() =>
      AgentTaskLog.create({
        taskId: 'aitask-123',
        message: '   '
      })
    ).toThrow(ValidationError);
  });
});
