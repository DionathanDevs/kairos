import type { DatabaseSync } from 'node:sqlite';
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
  constructor(private db: DatabaseSync) {}

  public findAll(): Habit[] {
    const rows = this.db
      .prepare('SELECT * FROM habits ORDER BY order_index ASC, created_at ASC')
      .all() as unknown as HabitRow[];

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
    const row = this.db.prepare('SELECT * FROM habits WHERE id = ?').get(id) as unknown as HabitRow | undefined;
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
    this.db
      .prepare(`
        INSERT INTO habits (id, title, description, color, order_index, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          color = excluded.color,
          order_index = excluded.order_index
      `)
      .run(
        habit.id,
        habit.title,
        habit.description,
        habit.color,
        habit.orderIndex,
        habit.createdAt
      );
  }

  public delete(id: string): boolean {
    const res = this.db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  public getNextOrderIndex(): number {
    const row = this.db.prepare('SELECT MAX(order_index) as max_idx FROM habits').get() as unknown as { max_idx: number | null };
    return (row?.max_idx ?? -1) + 1;
  }

  public count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM habits').get() as unknown as { count: number };
    return Number(row.count ?? 0);
  }
}
