import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { DomainError, ValidationError, NotFoundError } from '../../domain/errors/DomainError.js';
import type { AgentTaskStatus } from '../../domain/entities/AgentTask.js';
import type { AgentTaskLogLevel } from '../../domain/entities/AgentTaskLog.js';
import type { TaskPriority } from '../../domain/entities/Task.js';
import type {
  GetAgentTasksUseCase,
  GetAgentTaskByIdUseCase,
  CreateAgentTaskUseCase,
  UpdateAgentTaskUseCase,
  MarkAgentTaskReadyUseCase,
  ClaimNextAgentTaskUseCase,
  AppendAgentTaskLogUseCase,
  CompleteAgentTaskUseCase,
  DeleteAgentTaskUseCase
} from '../../application/usecases/AgentTaskUseCases.js';

export class AgentTaskController {
  constructor(
    private getAgentTasksUseCase: GetAgentTasksUseCase,
    private getAgentTaskByIdUseCase: GetAgentTaskByIdUseCase,
    private createAgentTaskUseCase: CreateAgentTaskUseCase,
    private updateAgentTaskUseCase: UpdateAgentTaskUseCase,
    private markAgentTaskReadyUseCase: MarkAgentTaskReadyUseCase,
    private claimNextAgentTaskUseCase: ClaimNextAgentTaskUseCase,
    private appendAgentTaskLogUseCase: AppendAgentTaskLogUseCase,
    private completeAgentTaskUseCase: CompleteAgentTaskUseCase,
    private deleteAgentTaskUseCase: DeleteAgentTaskUseCase,
    private agentApiKey: string = process.env.AGENT_API_KEY || ''
  ) {}

  public getAll = (req: Request, res: Response): void => {
    try {
      const status = req.query.status as AgentTaskStatus | undefined;
      const data = this.getAgentTasksUseCase.execute(status);
      res.json(data);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public getById = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const task = this.getAgentTaskByIdUseCase.execute(id);
      res.json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public create = (req: Request, res: Response): void => {
    try {
      const {
        title = '',
        intent = '',
        repository_url = '',
        description,
        acceptance_criteria,
        target_branch,
        priority,
        status
      } = req.body || {};

      const task = this.createAgentTaskUseCase.execute({
        title,
        intent,
        repository_url,
        description,
        acceptance_criteria,
        target_branch,
        priority: priority as TaskPriority | undefined,
        status: status as AgentTaskStatus | undefined
      });
      res.status(201).json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public update = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const {
        title = '',
        intent = '',
        repository_url = '',
        description,
        acceptance_criteria,
        target_branch,
        priority,
        status,
        artifact_url
      } = req.body || {};

      const task = this.updateAgentTaskUseCase.execute({
        id,
        title,
        intent,
        repository_url,
        description,
        acceptance_criteria,
        target_branch,
        priority: priority as TaskPriority | undefined,
        status: status as AgentTaskStatus | undefined,
        artifact_url
      });
      res.json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  /**
   * 1. Marcar uma Tarefa como Elegível para Automação (status -> ready)
   */
  public markReady = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const task = this.markAgentTaskReadyUseCase.execute(id);
      res.json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  /**
   * 2. Buscar a Próxima Tarefa Pendente na Fila (ready -> in_progress)
   */
  public claimNext = (req: Request, res: Response): void => {
    try {
      if (!this.authorizeExternalAgent(req, res)) return;
      const agentName = (req.body?.agent_name as string | undefined) || undefined;
      const result = this.claimNextAgentTaskUseCase.execute(agentName);
      res.json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  /**
   * 3. Registrar o Progresso ou Impedimento da Tarefa
   */
  public appendLog = (req: Request, res: Response): void => {
    try {
      if (!this.authorizeExternalAgent(req, res)) return;
      const id = req.params.id as string;
      const { level, message = '', metadata, mark_blocked } = req.body || {};
      const result = this.appendAgentTaskLogUseCase.execute({
        id,
        level: level as AgentTaskLogLevel | undefined,
        message,
        metadata,
        mark_blocked: Boolean(mark_blocked)
      });
      res.status(201).json(result);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  /**
   * 4. Concluir a Tarefa com o Artefato Gerado (ex: Link do PR)
   */
  public complete = (req: Request, res: Response): void => {
    try {
      if (!this.authorizeExternalAgent(req, res)) return;
      const id = req.params.id as string;
      const { artifact_url = '', summary, status } = req.body || {};
      const task = this.completeAgentTaskUseCase.execute({
        id,
        artifact_url,
        summary,
        status
      });
      res.json(task);
    } catch (err) {
      this.handleError(err, res);
    }
  };

  public delete = (req: Request, res: Response): void => {
    try {
      const id = req.params.id as string;
      const success = this.deleteAgentTaskUseCase.execute(id);
      res.json({ success });
    } catch (err) {
      this.handleError(err, res);
    }
  };

  private authorizeExternalAgent(req: Request, res: Response): boolean {
    const expectedKey = (this.agentApiKey || process.env.AGENT_API_KEY || '').trim();
    if (!expectedKey) {
      return true;
    }

    const headerKey = (req.headers['x-agent-api-key'] as string | undefined)?.trim();
    const authHeader = (req.headers.authorization as string | undefined)?.trim();
    const bearerKey = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

    const providedKey = headerKey || bearerKey || '';
    if (!providedKey) {
      res.status(401).json({ error: 'Token de autenticação do agente ausente.' });
      return false;
    }

    const expectedBuf = Buffer.from(expectedKey, 'utf8');
    const providedBuf = Buffer.from(providedKey, 'utf8');

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      res.status(401).json({ error: 'Token de autenticação do agente inválido.' });
      return false;
    }

    return true;
  }

  private handleError(err: unknown, res: Response): void {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof DomainError) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error('[AgentTaskController] Unexpected error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Erro interno do servidor.'
    });
  }
}
