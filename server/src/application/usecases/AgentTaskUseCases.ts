import { AgentTask, type AgentTaskStatus } from '../../domain/entities/AgentTask.js';
import { AgentTaskLog, type AgentTaskLogLevel } from '../../domain/entities/AgentTaskLog.js';
import type { TaskPriority } from '../../domain/entities/Task.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IAgentTaskRepository } from '../../domain/repositories/IAgentTaskRepository.js';

export interface AgentTaskLogDTO {
  id: string;
  task_id: string;
  level: AgentTaskLogLevel;
  message: string;
  metadata: string;
  created_at: string;
}

export interface AgentTaskDTO {
  id: string;
  title: string;
  intent: string;
  description: string;
  acceptance_criteria: string;
  repository_url: string;
  target_branch: string;
  priority: TaskPriority;
  status: AgentTaskStatus;
  artifact_url: string;
  agent_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  logs: AgentTaskLogDTO[];
}

function toAgentTaskDTO(task: AgentTask, logs: AgentTaskLog[]): AgentTaskDTO {
  return {
    ...task.toJSON(),
    logs: logs.map((l) => l.toJSON())
  };
}

export class GetAgentTasksUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(status?: AgentTaskStatus): { tasks: AgentTaskDTO[] } {
    const tasks = this.agentTaskRepo.findAll(status);
    const logsMap = this.agentTaskRepo.findLogsByTaskIds(tasks.map((t) => t.id));
    return {
      tasks: tasks.map((t) => toAgentTaskDTO(t, logsMap.get(t.id) || []))
    };
  }
}

export class GetAgentTaskByIdUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(id: string): AgentTaskDTO {
    const task = this.agentTaskRepo.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }
    const logs = this.agentTaskRepo.findLogsByTaskId(id);
    return toAgentTaskDTO(task, logs);
  }
}

export class CreateAgentTaskUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(input: {
    title: string;
    intent: string;
    repository_url: string;
    description?: string;
    acceptance_criteria?: string;
    target_branch?: string;
    priority?: TaskPriority;
    status?: AgentTaskStatus;
  }): AgentTaskDTO {
    const nextOrder = this.agentTaskRepo.getNextOrderIndex();
    const task = AgentTask.create({
      title: input.title,
      intent: input.intent,
      repositoryUrl: input.repository_url,
      description: input.description || '',
      acceptanceCriteria: input.acceptance_criteria || '',
      targetBranch: input.target_branch || '',
      priority: input.priority || 'medium',
      status: input.status || 'planning',
      orderIndex: nextOrder
    });

    this.agentTaskRepo.save(task);

    const initialLog = AgentTaskLog.create({
      taskId: task.id,
      level: 'info',
      message:
        task.status === 'ready'
          ? 'Tarefa criada e já marcada como pronta para execução externa (IA).'
          : 'Tarefa registrada em fase de planejamento.'
    });
    this.agentTaskRepo.addLog(initialLog);

    return toAgentTaskDTO(task, [initialLog]);
  }
}

export class UpdateAgentTaskUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(input: {
    id: string;
    title: string;
    intent: string;
    repository_url: string;
    description?: string;
    acceptance_criteria?: string;
    target_branch?: string;
    priority?: TaskPriority;
    status?: AgentTaskStatus;
    artifact_url?: string;
  }): AgentTaskDTO {
    const task = this.agentTaskRepo.findById(input.id);
    if (!task) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }

    const previousStatus = task.status;
    task.update({
      title: input.title,
      intent: input.intent,
      repositoryUrl: input.repository_url,
      description: input.description,
      acceptanceCriteria: input.acceptance_criteria,
      targetBranch: input.target_branch,
      priority: input.priority,
      status: input.status,
      artifactUrl: input.artifact_url
    });
    this.agentTaskRepo.save(task);

    if (input.status && input.status !== previousStatus) {
      const statusLog = AgentTaskLog.create({
        taskId: task.id,
        level: 'info',
        message: `Estado da tarefa alterado de "${previousStatus}" para "${task.status}".`
      });
      this.agentTaskRepo.addLog(statusLog);
    }

    const logs = this.agentTaskRepo.findLogsByTaskId(task.id);
    return toAgentTaskDTO(task, logs);
  }
}

/**
 * 1. Marcar uma Tarefa como Elegível para Automação
 */
export class MarkAgentTaskReadyUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(id: string): AgentTaskDTO {
    const task = this.agentTaskRepo.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }

    task.markReady();
    this.agentTaskRepo.save(task);

    const log = AgentTaskLog.create({
      taskId: task.id,
      level: 'info',
      message: 'Tarefa marcada como elegível (ready) e liberada na fila para automação por IA.'
    });
    this.agentTaskRepo.addLog(log);

    const logs = this.agentTaskRepo.findLogsByTaskId(task.id);
    return toAgentTaskDTO(task, logs);
  }
}

/**
 * 2. Buscar a Próxima Tarefa Pendente na Fila
 */
export class ClaimNextAgentTaskUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(agentName?: string): { task: AgentTaskDTO | null } {
    const claimedTask = this.agentTaskRepo.claimNextReadyTask(agentName);
    if (!claimedTask) {
      return { task: null };
    }

    const logs = this.agentTaskRepo.findLogsByTaskId(claimedTask.id);
    return {
      task: toAgentTaskDTO(claimedTask, logs)
    };
  }
}

/**
 * 3. Registrar o Progresso ou Impedimento da Tarefa
 */
export class AppendAgentTaskLogUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(input: {
    id: string;
    level?: AgentTaskLogLevel;
    message: string;
    metadata?: string;
    mark_blocked?: boolean;
  }): { log: AgentTaskLogDTO; task: AgentTaskDTO } {
    const task = this.agentTaskRepo.findById(input.id);
    if (!task) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }

    const level = input.level || 'progress';
    const log = AgentTaskLog.create({
      taskId: task.id,
      level,
      message: input.message,
      metadata: input.metadata || ''
    });
    this.agentTaskRepo.addLog(log);

    if (level === 'impediment' || input.mark_blocked === true) {
      task.markBlocked();
      this.agentTaskRepo.save(task);
    }

    const logs = this.agentTaskRepo.findLogsByTaskId(task.id);
    return {
      log: log.toJSON(),
      task: toAgentTaskDTO(task, logs)
    };
  }
}

/**
 * 4. Concluir a Tarefa com o Artefato Gerado (ex: Link do PR)
 */
export class CompleteAgentTaskUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(input: {
    id: string;
    artifact_url: string;
    summary?: string;
    status?: 'in_review' | 'completed';
  }): AgentTaskDTO {
    const task = this.agentTaskRepo.findById(input.id);
    if (!task) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }

    const targetStatus = input.status || 'in_review';
    task.completeWithArtifact(input.artifact_url, targetStatus);
    this.agentTaskRepo.save(task);

    const logMsg = input.summary && input.summary.trim().length > 0
      ? `${input.summary.trim()} — Artefato entregue: ${task.artifactUrl}`
      : `Execução concluída com artefato: ${task.artifactUrl}`;

    const log = AgentTaskLog.create({
      taskId: task.id,
      level: 'artifact',
      message: logMsg,
      metadata: task.artifactUrl
    });
    this.agentTaskRepo.addLog(log);

    const logs = this.agentTaskRepo.findLogsByTaskId(task.id);
    return toAgentTaskDTO(task, logs);
  }
}

export class DeleteAgentTaskUseCase {
  constructor(private agentTaskRepo: IAgentTaskRepository) {}

  public execute(id: string): boolean {
    const exists = this.agentTaskRepo.findById(id);
    if (!exists) {
      throw new NotFoundError('Tarefa de IA não encontrada.');
    }
    return this.agentTaskRepo.delete(id);
  }
}
