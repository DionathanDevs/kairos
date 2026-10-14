import type { DatabaseSync } from 'node:sqlite';
import { HabitLog } from '../../../domain/entities/HabitLog.js';
import type { IHabitLogRepository } from '../../../domain/repositories/IHabitLogRepository.js';

interface LogRow {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
}

export class SQLiteHabitLogRepository implements IHabitLogRepository {
  constructor(private db: DatabaseSync) {}

  public findByHabitAndDate(habitId: string, date: string): HabitLog | null {
    const row = this.db
      .prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?')
      .get(habitId, date) as unknown as LogRow | undefined;

    if (!row) return null;

    return new HabitLog({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1
    });
  }

  public findByHabitAndDateRange(habitId: string, startDate: string, endDate: string): HabitLog[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM habit_logs 
        WHERE habit_id = ? AND date BETWEEN ? AND ?
      `)
      .all(habitId, startDate, endDate) as unknown as LogRow[];

    return rows.map(
      (r) =>
        new HabitLog({
          id: r.id,
          habitId: r.habit_id,
          date: r.date,
          completed: r.completed === 1
        })
    );
  }

  public findCompletedGroupedByDate(startDate: string, endDate: string): Map<string, number> {
    const rows = this.db
      .prepare(`
        SELECT date, SUM(completed) as comp_count
        FROM habit_logs
        WHERE date BETWEEN ? AND ?
        GROUP BY date
      `)
      .all(startDate, endDate) as unknown as { date: string; comp_count: number }[];

    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.date, Number(r.comp_count));
    }
    return map;
  }

  public countCompletedOnDate(date: string): number {
    const row = this.db
      .prepare('SELECT SUM(completed) as count FROM habit_logs WHERE date = ?')
      .get(date) as unknown as { count: number | null };

    return Number(row?.count ?? 0);
  }

  public save(log: HabitLog): void {
    this.db
      .prepare(`
        INSERT INTO habit_logs (id, habit_id, date, completed)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
      `)
      .run(log.id, log.habitId, log.date, log.completed ? 1 : 0);
  }

  public saveBatch(logs: HabitLog[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO habit_logs (id, habit_id, date, completed)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
    `);

    for (const l of logs) {
      stmt.run(l.id, l.habitId, l.date, l.completed ? 1 : 0);
    }
  }

  public deleteByHabitId(habitId: string): void {
    this.db.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(habitId);
  }

  public resetByDateRange(startDate: string, endDate: string): number {
    const res = this.db
      .prepare(`
        UPDATE habit_logs
        SET completed = 0
        WHERE date BETWEEN ? AND ?
      `)
      .run(startDate, endDate);

    return Number(res.changes);
  }
}
