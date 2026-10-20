import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { Task, type TaskCategory, type TaskPriority } from '../../../domain/entities/Task.js';
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';

interface TaskRow {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  completed: number;
  order_index: number;
  created_at: string;
}

const ORDER_BY_CLAUSE = `
  ORDER BY
    completed ASC,
    CASE priority
      WHEN 'high' THEN 0
      WHEN 'medium' THEN 1
      WHEN 'low' THEN 2
      ELSE 3
    END ASC,
    order_index ASC,
    created_at ASC
`;

export class SQLiteTaskRepository implements ITaskRepository {
  private stmtFindAll?: StatementSync;
  private stmtFindAllPaginated?: StatementSync;
  private stmtFindByCategory?: StatementSync;
  private stmtFindByCategoryPaginated?: StatementSync;
  private stmtFindById?: StatementSync;
  private stmtSave?: StatementSync;
  private stmtDelete?: StatementSync;
  private stmtMaxIdx?: StatementSync;
  private stmtMarkAllCompleted?: StatementSync;
  private stmtClearCompleted?: StatementSync;

  constructor(private db: DatabaseSync) {}

  private mapRow(r: TaskRow): Task {
    return new Task({
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority as TaskPriority,
      category: r.category as TaskCategory,
      completed: Number(r.completed) === 1,
      orderIndex: Number(r.order_index),
      createdAt: r.created_at
    });
  }

  public findAll(category?: TaskCategory, limit?: number, offset: number = 0): Task[] {
    const hasPagination = typeof limit === 'number' && limit > 0;

    if (category) {
      if (hasPagination) {
        this.stmtFindByCategoryPaginated ??= this.db.prepare(
          `SELECT * FROM tasks WHERE category = ? ${ORDER_BY_CLAUSE} LIMIT ? OFFSET ?`
        );
        const rows = this.stmtFindByCategoryPaginated.all(category, limit, offset) as unknown as TaskRow[];
        return rows.map((r) => this.mapRow(r));
      }

      this.stmtFindByCategory ??= this.db.prepare(
        `SELECT * FROM tasks WHERE category = ? ${ORDER_BY_CLAUSE}`
      );
      const rows = this.stmtFindByCategory.all(category) as unknown as TaskRow[];
      return rows.map((r) => this.mapRow(r));
    }

    if (hasPagination) {
      this.stmtFindAllPaginated ??= this.db.prepare(
        `SELECT * FROM tasks ${ORDER_BY_CLAUSE} LIMIT ? OFFSET ?`
      );
      const rows = this.stmtFindAllPaginated.all(limit, offset) as unknown as TaskRow[];
      return rows.map((r) => this.mapRow(r));
    }

    this.stmtFindAll ??= this.db.prepare(`SELECT * FROM tasks ${ORDER_BY_CLAUSE}`);
    const rows = this.stmtFindAll.all() as unknown as TaskRow[];
    return rows.map((r) => this.mapRow(r));
  }

  public findById(id: string): Task | null {
    this.stmtFindById ??= this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = this.stmtFindById.get(id) as unknown as TaskRow | undefined;
    if (!row) return null;
    return this.mapRow(row);
  }

  public save(task: Task): void {
    this.stmtSave ??= this.db.prepare(`
      INSERT INTO tasks (id, title, description, priority, category, completed, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        priority = excluded.priority,
        category = excluded.category,
        completed = excluded.completed,
        order_index = excluded.order_index
    `);
    this.stmtSave.run(
      task.id,
      task.title,
      task.description,
      task.priority,
      task.category,
      task.completed ? 1 : 0,
      task.orderIndex,
      task.createdAt
    );
  }

  public delete(id: string): boolean {
    this.stmtDelete ??= this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const res = this.stmtDelete.run(id);
    return Number(res.changes) > 0;
  }

  public getNextOrderIndex(): number {
    this.stmtMaxIdx ??= this.db.prepare('SELECT MAX(order_index) as max_idx FROM tasks');
    const row = this.stmtMaxIdx.get() as unknown as { max_idx: number | null };
    return (row?.max_idx ?? -1) + 1;
  }

  public markAllCompleted(category: TaskCategory): number {
    this.stmtMarkAllCompleted ??= this.db.prepare(
      'UPDATE tasks SET completed = 1 WHERE category = ? AND completed = 0'
    );
    const res = this.stmtMarkAllCompleted.run(category);
    return Number(res.changes);
  }

  public clearCompleted(category: TaskCategory): number {
    this.stmtClearCompleted ??= this.db.prepare(
      'DELETE FROM tasks WHERE category = ? AND completed = 1'
    );
    const res = this.stmtClearCompleted.run(category);
    return Number(res.changes);
  }
}
