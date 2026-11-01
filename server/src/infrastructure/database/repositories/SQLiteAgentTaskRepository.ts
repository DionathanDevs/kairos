import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { AgentTask, type AgentTaskStatus } from '../../../domain/entities/AgentTask.js';
import { AgentTaskLog, type AgentTaskLogLevel } from '../../../domain/entities/AgentTaskLog.js';
import type { TaskPriority } from '../../../domain/entities/Task.js';
import type { IAgentTaskRepository } from '../../../domain/repositories/IAgentTaskRepository.js';

interface AgentTaskRow {
  id: string;
  title: string;
  intent: string;
  description: string;
  acceptance_criteria: string;
  repository_url: string;
  target_branch: string;
  priority: string;
  status: string;
  artifact_url: string;
  agent_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface AgentTaskLogRow {
  id: string;
  task_id: string;
  level: string;
  message: string;
  metadata: string;
  created_at: string;
}

const ORDER_BY_CLAUSE = `
  ORDER BY
    CASE status
      WHEN 'in_progress' THEN 0
      WHEN 'blocked' THEN 1
      WHEN 'ready' THEN 2
      WHEN 'in_review' THEN 3
      WHEN 'planning' THEN 4
      WHEN 'completed' THEN 5
      ELSE 6
    END ASC,
    CASE priority
      WHEN 'high' THEN 0
      WHEN 'medium' THEN 1
      WHEN 'low' THEN 2
      ELSE 3
    END ASC,
    order_index ASC,
    created_at ASC
`;

const QUEUE_PRIORITY_ORDER = `
  ORDER BY
    CASE priority
      WHEN 'high' THEN 0
      WHEN 'medium' THEN 1
      WHEN 'low' THEN 2
      ELSE 3
    END ASC,
    order_index ASC,
    created_at ASC
  LIMIT 1
`;

export class SQLiteAgentTaskRepository implements IAgentTaskRepository {
  private stmtFindAll?: StatementSync;
  private stmtFindByStatus?: StatementSync;
  private stmtFindById?: StatementSync;
  private stmtSelectNextReady?: StatementSync;
  private stmtSave?: StatementSync;
  private stmtDelete?: StatementSync;
  private stmtMaxIdx?: StatementSync;
  private stmtAddLog?: StatementSync;
  private stmtFindLogsByTask?: StatementSync;

  constructor(private db: DatabaseSync) {}

  private mapTaskRow(r: AgentTaskRow): AgentTask {
    return new AgentTask({
      id: r.id,
      title: r.title,
      intent: r.intent,
      description: r.description || '',
      acceptanceCriteria: r.acceptance_criteria || '',
      repositoryUrl: r.repository_url,
      targetBranch: r.target_branch || '',
      priority: r.priority as TaskPriority,
      status: r.status as AgentTaskStatus,
      artifactUrl: r.artifact_url || '',
      agentName: r.agent_name || '',
      orderIndex: Number(r.order_index),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      startedAt: r.started_at || null,
      completedAt: r.completed_at || null
    });
  }

  private mapLogRow(r: AgentTaskLogRow): AgentTaskLog {
    return new AgentTaskLog({
      id: r.id,
      taskId: r.task_id,
      level: r.level as AgentTaskLogLevel,
      message: r.message,
      metadata: r.metadata || '',
      createdAt: r.created_at
    });
  }

  public findAll(status?: AgentTaskStatus): AgentTask[] {
    if (status) {
      this.stmtFindByStatus ??= this.db.prepare(
        `SELECT * FROM ai_tasks WHERE status = ? ${ORDER_BY_CLAUSE}`
      );
      const rows = this.stmtFindByStatus.all(status) as unknown as AgentTaskRow[];
      return rows.map((r) => this.mapTaskRow(r));
    }

    this.stmtFindAll ??= this.db.prepare(`SELECT * FROM ai_tasks ${ORDER_BY_CLAUSE}`);
    const rows = this.stmtFindAll.all() as unknown as AgentTaskRow[];
    return rows.map((r) => this.mapTaskRow(r));
  }

  public findById(id: string): AgentTask | null {
    this.stmtFindById ??= this.db.prepare('SELECT * FROM ai_tasks WHERE id = ?');
    const row = this.stmtFindById.get(id) as unknown as AgentTaskRow | undefined;
    if (!row) return null;
    return this.mapTaskRow(row);
  }

  public claimNextReadyTask(agentName?: string): AgentTask | null {
    this.stmtSelectNextReady ??= this.db.prepare(
      `SELECT * FROM ai_tasks WHERE status = 'ready' ${QUEUE_PRIORITY_ORDER}`
    );

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.stmtSelectNextReady.get() as unknown as AgentTaskRow | undefined;
      if (!row) {
        this.db.exec('COMMIT');
        return null;
      }

      const task = this.mapTaskRow(row);
      task.claim(agentName);
      this.save(task);

      const actorLabel = task.agentName ? ` pelo agente "${task.agentName}"` : '';
      const claimLog = AgentTaskLog.create({
        taskId: task.id,
        level: 'progress',
        message: `Tarefa assumida na fila de execução${actorLabel}. Status alterado para "in_progress".`
      });
      this.addLog(claimLog);

      this.db.exec('COMMIT');
      return task;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  public save(task: AgentTask): void {
    this.stmtSave ??= this.db.prepare(`
      INSERT INTO ai_tasks (
        id, title, intent, description, acceptance_criteria,
        repository_url, target_branch, priority, status,
        artifact_url, agent_name, order_index,
        created_at, updated_at, started_at, completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        intent = excluded.intent,
        description = excluded.description,
        acceptance_criteria = excluded.acceptance_criteria,
        repository_url = excluded.repository_url,
        target_branch = excluded.target_branch,
        priority = excluded.priority,
        status = excluded.status,
        artifact_url = excluded.artifact_url,
        agent_name = excluded.agent_name,
        order_index = excluded.order_index,
        updated_at = excluded.updated_at,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at
    `);

    this.stmtSave.run(
      task.id,
      task.title,
      task.intent,
      task.description,
      task.acceptanceCriteria,
      task.repositoryUrl,
      task.targetBranch,
      task.priority,
      task.status,
      task.artifactUrl,
      task.agentName,
      task.orderIndex,
      task.createdAt,
      task.updatedAt,
      task.startedAt,
      task.completedAt
    );
  }

  public delete(id: string): boolean {
    // Also clean up logs explicitly in case foreign keys pragma is not enabled on custom connection
    this.db.prepare('DELETE FROM ai_task_logs WHERE task_id = ?').run(id);
    this.stmtDelete ??= this.db.prepare('DELETE FROM ai_tasks WHERE id = ?');
    const res = this.stmtDelete.run(id);
    return Number(res.changes) > 0;
  }

  public getNextOrderIndex(): number {
    this.stmtMaxIdx ??= this.db.prepare('SELECT MAX(order_index) as max_idx FROM ai_tasks');
    const row = this.stmtMaxIdx.get() as unknown as { max_idx: number | null };
    return (row?.max_idx ?? -1) + 1;
  }

  public addLog(log: AgentTaskLog): void {
    this.stmtAddLog ??= this.db.prepare(`
      INSERT INTO ai_task_logs (id, task_id, level, message, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    this.stmtAddLog.run(
      log.id,
      log.taskId,
      log.level,
      log.message,
      log.metadata,
      log.createdAt
    );
  }

  public findLogsByTaskId(taskId: string): AgentTaskLog[] {
    this.stmtFindLogsByTask ??= this.db.prepare(
      'SELECT * FROM ai_task_logs WHERE task_id = ? ORDER BY created_at ASC'
    );
    const rows = this.stmtFindLogsByTask.all(taskId) as unknown as AgentTaskLogRow[];
    return rows.map((r) => this.mapLogRow(r));
  }

  public findLogsByTaskIds(taskIds: string[]): Map<string, AgentTaskLog[]> {
    const map = new Map<string, AgentTaskLog[]>();
    if (taskIds.length === 0) return map;

    const placeholders = taskIds.map(() => '?').join(', ');
    const stmt = this.db.prepare(
      `SELECT * FROM ai_task_logs WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`
    );
    const rows = stmt.all(...taskIds) as unknown as AgentTaskLogRow[];

    for (const row of rows) {
      const log = this.mapLogRow(row);
      const list = map.get(log.taskId) || [];
      list.push(log);
      map.set(log.taskId, list);
    }

    return map;
  }
}
