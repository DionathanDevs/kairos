import { DomainError, ValidationError } from '../errors/DomainError.js';
import type { TaskPriority } from './Task.js';

export type AgentTaskStatus =
  | 'planning'
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'in_review'
  | 'completed';

const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const VALID_STATUSES: AgentTaskStatus[] = [
  'planning',
  'ready',
  'in_progress',
  'blocked',
  'in_review',
  'completed'
];

export interface AgentTaskProps {
  id: string;
  title: string;
  intent: string;
  description?: string;
  acceptanceCriteria?: string;
  repositoryUrl: string;
  targetBranch?: string;
  priority?: TaskPriority;
  status?: AgentTaskStatus;
  artifactUrl?: string;
  agentName?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export class AgentTask {
  private _id: string;
  private _title: string;
  private _intent: string;
  private _description: string;
  private _acceptanceCriteria: string;
  private _repositoryUrl: string;
  private _targetBranch: string;
  private _priority: TaskPriority;
  private _status: AgentTaskStatus;
  private _artifactUrl: string;
  private _agentName: string;
  private _orderIndex: number;
  private _createdAt: string;
  private _updatedAt: string;
  private _startedAt: string | null;
  private _completedAt: string | null;

  constructor(props: AgentTaskProps) {
    this.validateTitle(props.title);
    this.validateIntent(props.intent);
    this.validateRepositoryUrl(props.repositoryUrl);

    const priority = props.priority || 'medium';
    const status = props.status || 'planning';
    this.validatePriority(priority);
    this.validateStatus(status);

    const now = new Date().toISOString();
    this._id = props.id;
    this._title = props.title.trim();
    this._intent = props.intent.trim();
    this._description = (props.description || '').trim();
    this._acceptanceCriteria = (props.acceptanceCriteria || '').trim();
    this._repositoryUrl = props.repositoryUrl.trim();
    this._targetBranch = (props.targetBranch || '').trim();
    this._priority = priority;
    this._status = status;
    this._artifactUrl = (props.artifactUrl || '').trim();
    this._agentName = (props.agentName || '').trim();
    this._orderIndex = props.orderIndex ?? 0;
    this._createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || this._createdAt;
    this._startedAt = props.startedAt ?? null;
    this._completedAt = props.completedAt ?? null;
  }

  public static create(input: {
    title: string;
    intent: string;
    repositoryUrl: string;
    description?: string;
    acceptanceCriteria?: string;
    targetBranch?: string;
    priority?: TaskPriority;
    status?: AgentTaskStatus;
    orderIndex?: number;
  }): AgentTask {
    const id = `aitask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    return new AgentTask({
      id,
      title: input.title,
      intent: input.intent,
      repositoryUrl: input.repositoryUrl,
      description: input.description,
      acceptanceCriteria: input.acceptanceCriteria,
      targetBranch: input.targetBranch,
      priority: input.priority || 'medium',
      status: input.status || 'planning',
      orderIndex: input.orderIndex ?? 0,
      createdAt: now,
      updatedAt: now
    });
  }

  public update(input: {
    title: string;
    intent: string;
    repositoryUrl: string;
    description?: string;
    acceptanceCriteria?: string;
    targetBranch?: string;
    priority?: TaskPriority;
    status?: AgentTaskStatus;
    artifactUrl?: string;
  }): void {
    this.validateTitle(input.title);
    this.validateIntent(input.intent);
    this.validateRepositoryUrl(input.repositoryUrl);

    if (input.priority !== undefined) {
      this.validatePriority(input.priority);
      this._priority = input.priority;
    }

    if (input.status !== undefined) {
      this.validateStatus(input.status);
      this._status = input.status;
      if (input.status === 'completed' && !this._completedAt) {
        this._completedAt = new Date().toISOString();
      }
    }

    if (input.artifactUrl !== undefined) {
      this._artifactUrl = input.artifactUrl.trim();
    }

    this._title = input.title.trim();
    this._intent = input.intent.trim();
    this._repositoryUrl = input.repositoryUrl.trim();
    if (input.description !== undefined) {
      this._description = input.description.trim();
    }
    if (input.acceptanceCriteria !== undefined) {
      this._acceptanceCriteria = input.acceptanceCriteria.trim();
    }
    if (input.targetBranch !== undefined) {
      this._targetBranch = input.targetBranch.trim();
    }
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 1. Marcar Tarefa como Elegível para Automação (planning / blocked / in_review -> ready)
   */
  public markReady(): void {
    this.validateIntent(this._intent);
    this.validateRepositoryUrl(this._repositoryUrl);
    this._status = 'ready';
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 2. Buscar / Reservar a Tarefa para Execução Externa (ready -> in_progress)
   */
  public claim(agentName?: string): void {
    if (this._status !== 'ready') {
      throw new DomainError(
        `A tarefa não está pronta para execução (status atual: ${this._status}).`
      );
    }
    const now = new Date().toISOString();
    this._status = 'in_progress';
    this._startedAt = now;
    this._updatedAt = now;
    if (agentName && agentName.trim().length > 0) {
      this._agentName = agentName.trim();
    }
  }

  /**
   * 3. Marcar como Impedimento (blocked)
   */
  public markBlocked(): void {
    this._status = 'blocked';
    this._updatedAt = new Date().toISOString();
  }

  /**
   * 4. Concluir Tarefa com Artefato Gerado (ex: Link do PR)
   */
  public completeWithArtifact(
    artifactUrl: string,
    targetStatus: 'in_review' | 'completed' = 'in_review'
  ): void {
    if (!artifactUrl || typeof artifactUrl !== 'string' || artifactUrl.trim().length === 0) {
      throw new ValidationError('A referência do artefato gerado (ex: link do PR) é obrigatória.');
    }
    if (artifactUrl.trim().length > 1000) {
      throw new ValidationError('O link do artefato não pode exceder 1000 caracteres.');
    }
    if (targetStatus !== 'in_review' && targetStatus !== 'completed') {
      throw new ValidationError('O status de conclusão deve ser in_review ou completed.');
    }

    const now = new Date().toISOString();
    this._artifactUrl = artifactUrl.trim();
    this._status = targetStatus;
    this._completedAt = now;
    this._updatedAt = now;
  }

  public approveReview(): void {
    const now = new Date().toISOString();
    this._status = 'completed';
    if (!this._completedAt) {
      this._completedAt = now;
    }
    this._updatedAt = now;
  }

  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('O título da tarefa de IA é obrigatório.');
    }
    if (title.trim().length > 120) {
      throw new ValidationError('O título da tarefa de IA não pode ter mais de 120 caracteres.');
    }
  }

  private validateIntent(intent: string): void {
    if (!intent || typeof intent !== 'string' || intent.trim().length === 0) {
      throw new ValidationError('A intenção da tarefa (prompt/objetivo) é obrigatória.');
    }
    if (intent.trim().length > 2000) {
      throw new ValidationError('A intenção da tarefa não pode exceder 2000 caracteres.');
    }
  }

  private validateRepositoryUrl(repositoryUrl: string): void {
    if (!repositoryUrl || typeof repositoryUrl !== 'string' || repositoryUrl.trim().length === 0) {
      throw new ValidationError('O repositório referenciado é obrigatório.');
    }
    if (repositoryUrl.trim().length > 500) {
      throw new ValidationError('O repositório referenciado não pode exceder 500 caracteres.');
    }
  }

  private validatePriority(priority: string): void {
    if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
      throw new ValidationError('A prioridade deve ser high, medium ou low.');
    }
  }

  private validateStatus(status: string): void {
    if (!VALID_STATUSES.includes(status as AgentTaskStatus)) {
      throw new ValidationError(
        'Status inválido. Valores permitidos: planning, ready, in_progress, blocked, in_review, completed.'
      );
    }
  }

  public get id(): string { return this._id; }
  public get title(): string { return this._title; }
  public get intent(): string { return this._intent; }
  public get description(): string { return this._description; }
  public get acceptanceCriteria(): string { return this._acceptanceCriteria; }
  public get repositoryUrl(): string { return this._repositoryUrl; }
  public get targetBranch(): string { return this._targetBranch; }
  public get priority(): TaskPriority { return this._priority; }
  public get status(): AgentTaskStatus { return this._status; }
  public get artifactUrl(): string { return this._artifactUrl; }
  public get agentName(): string { return this._agentName; }
  public get orderIndex(): number { return this._orderIndex; }
  public get createdAt(): string { return this._createdAt; }
  public get updatedAt(): string { return this._updatedAt; }
  public get startedAt(): string | null { return this._startedAt; }
  public get completedAt(): string | null { return this._completedAt; }

  public toJSON() {
    return {
      id: this._id,
      title: this._title,
      intent: this._intent,
      description: this._description,
      acceptance_criteria: this._acceptanceCriteria,
      repository_url: this._repositoryUrl,
      target_branch: this._targetBranch,
      priority: this._priority,
      status: this._status,
      artifact_url: this._artifactUrl,
      agent_name: this._agentName,
      order_index: this._orderIndex,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      started_at: this._startedAt,
      completed_at: this._completedAt
    };
  }
}
