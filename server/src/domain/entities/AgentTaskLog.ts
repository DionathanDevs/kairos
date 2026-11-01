import { ValidationError } from '../errors/DomainError.js';

export type AgentTaskLogLevel =
  | 'info'
  | 'progress'
  | 'error'
  | 'impediment'
  | 'artifact';

const VALID_LOG_LEVELS: AgentTaskLogLevel[] = [
  'info',
  'progress',
  'error',
  'impediment',
  'artifact'
];

export interface AgentTaskLogProps {
  id: string;
  taskId: string;
  level?: AgentTaskLogLevel;
  message: string;
  metadata?: string;
  createdAt?: string;
}

export class AgentTaskLog {
  private _id: string;
  private _taskId: string;
  private _level: AgentTaskLogLevel;
  private _message: string;
  private _metadata: string;
  private _createdAt: string;

  constructor(props: AgentTaskLogProps) {
    if (!props.taskId || props.taskId.trim().length === 0) {
      throw new ValidationError('O ID da tarefa é obrigatório para o log.');
    }
    this.validateMessage(props.message);

    const level = props.level || 'info';
    this.validateLevel(level);

    this._id = props.id;
    this._taskId = props.taskId.trim();
    this._level = level;
    this._message = props.message.trim();
    this._metadata = (props.metadata || '').trim();
    this._createdAt = props.createdAt || new Date().toISOString();
  }

  public static create(input: {
    taskId: string;
    level?: AgentTaskLogLevel;
    message: string;
    metadata?: string;
  }): AgentTaskLog {
    const id = `ailog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return new AgentTaskLog({
      id,
      taskId: input.taskId,
      level: input.level || 'info',
      message: input.message,
      metadata: input.metadata || '',
      createdAt: new Date().toISOString()
    });
  }

  private validateMessage(message: string): void {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('A mensagem de log/progresso é obrigatória.');
    }
    if (message.trim().length > 4000) {
      throw new ValidationError('A mensagem de log não pode exceder 4000 caracteres.');
    }
  }

  private validateLevel(level: string): void {
    if (!VALID_LOG_LEVELS.includes(level as AgentTaskLogLevel)) {
      throw new ValidationError(
        'O nível do log deve ser info, progress, error, impediment ou artifact.'
      );
    }
  }

  public get id(): string { return this._id; }
  public get taskId(): string { return this._taskId; }
  public get level(): AgentTaskLogLevel { return this._level; }
  public get message(): string { return this._message; }
  public get metadata(): string { return this._metadata; }
  public get createdAt(): string { return this._createdAt; }

  public toJSON() {
    return {
      id: this._id,
      task_id: this._taskId,
      level: this._level,
      message: this._message,
      metadata: this._metadata,
      created_at: this._createdAt
    };
  }
}
