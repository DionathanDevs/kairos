import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { Habit } from '../../../domain/entities/Habit.js';
import type { IHabitRepository } from '../../../domain/repositories/IHabitRepository.js';

interface HabitRow {
  id: string;
  title: string;
  description: string;
  color: string;
  order_index: number;
  created_at: string;
}

export class SQLiteHabitRepository implements IHabitRepository {
  private stmtFindAll?: StatementSync;
  private stmtFindById?: StatementSync;
  private stmtSave?: StatementSync;
  private stmtDelete?: StatementSync;
  private stmtMaxIdx?: StatementSync;
  private stmtCount?: StatementSync;

  constructor(private db: DatabaseSync) {}

  public findAll(): Habit[] {
    this.stmtFindAll ??= this.db.prepare(
      'SELECT * FROM habits ORDER BY order_index ASC, created_at ASC'
    );
    const rows = this.stmtFindAll.all() as unknown as HabitRow[];

    return rows.map(
      (r) =>
        new Habit({
          id: r.id,
          title: r.title,
          description: r.description,
          color: r.color,
          orderIndex: Number(r.order_index),
          createdAt: r.created_at
        })
    );
  }

  public findById(id: string): Habit | null {
    this.stmtFindById ??= this.db.prepare('SELECT * FROM habits WHERE id = ?');
    const row = this.stmtFindById.get(id) as unknown as HabitRow | undefined;
    if (!row) return null;

    return new Habit({
      id: row.id,
      title: row.title,
      description: row.description,
      color: row.color,
      orderIndex: Number(row.order_index),
      createdAt: row.created_at
    });
  }

  public save(habit: Habit): void {
    this.stmtSave ??= this.db.prepare(`
      INSERT INTO habits (id, title, description, color, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        color = excluded.color,
        order_index = excluded.order_index
    `);
    this.stmtSave.run(
      habit.id,
      habit.title,
      habit.description,
      habit.color,
      habit.orderIndex,
      habit.createdAt
    );
  }

  public delete(id: string): boolean {
    this.stmtDelete ??= this.db.prepare('DELETE FROM habits WHERE id = ?');
    const res = this.stmtDelete.run(id);
    return Number(res.changes) > 0;
  }

  public getNextOrderIndex(): number {
    this.stmtMaxIdx ??= this.db.prepare('SELECT MAX(order_index) as max_idx FROM habits');
    const row = this.stmtMaxIdx.get() as unknown as { max_idx: number | null };
    return (row?.max_idx ?? -1) + 1;
  }

  public count(): number {
    this.stmtCount ??= this.db.prepare('SELECT COUNT(*) as count FROM habits');
    const row = this.stmtCount.get() as unknown as { count: number };
    return Number(row.count ?? 0);
  }
}
