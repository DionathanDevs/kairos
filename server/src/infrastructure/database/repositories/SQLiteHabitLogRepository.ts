import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { HabitLog } from '../../../domain/entities/HabitLog.js';
import type { IHabitLogRepository } from '../../../domain/repositories/IHabitLogRepository.js';

interface LogRow {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
}

export class SQLiteHabitLogRepository implements IHabitLogRepository {
  private stmtFindByHabitAndDate?: StatementSync;
  private stmtFindByHabitAndDateRange?: StatementSync;
  private stmtFindCompletedGroupedByDate?: StatementSync;
  private stmtCountCompletedOnDate?: StatementSync;
  private stmtSave?: StatementSync;
  private stmtDeleteByHabitId?: StatementSync;
  private stmtResetByDateRange?: StatementSync;

  constructor(private db: DatabaseSync) {}

  public findByHabitAndDate(habitId: string, date: string): HabitLog | null {
    this.stmtFindByHabitAndDate ??= this.db.prepare(
      'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?'
    );
    const row = this.stmtFindByHabitAndDate.get(habitId, date) as unknown as LogRow | undefined;

    if (!row) return null;

    return new HabitLog({
      id: row.id,
      habitId: row.habit_id,
      date: row.date,
      completed: row.completed === 1
    });
  }

  public findByHabitAndDateRange(habitId: string, startDate: string, endDate: string): HabitLog[] {
    this.stmtFindByHabitAndDateRange ??= this.db.prepare(`
      SELECT * FROM habit_logs 
      WHERE habit_id = ? AND date BETWEEN ? AND ?
    `);
    const rows = this.stmtFindByHabitAndDateRange.all(habitId, startDate, endDate) as unknown as LogRow[];

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
    this.stmtFindCompletedGroupedByDate ??= this.db.prepare(`
      SELECT date, SUM(completed) as comp_count
      FROM habit_logs
      WHERE date BETWEEN ? AND ?
      GROUP BY date
    `);
    const rows = this.stmtFindCompletedGroupedByDate.all(startDate, endDate) as unknown as {
      date: string;
      comp_count: number;
    }[];

    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.date, Number(r.comp_count));
    }
    return map;
  }

  public countCompletedOnDate(date: string): number {
    this.stmtCountCompletedOnDate ??= this.db.prepare(
      'SELECT SUM(completed) as count FROM habit_logs WHERE date = ?'
    );
    const row = this.stmtCountCompletedOnDate.get(date) as unknown as { count: number | null };

    return Number(row?.count ?? 0);
  }

  public save(log: HabitLog): void {
    this.stmtSave ??= this.db.prepare(`
      INSERT INTO habit_logs (id, habit_id, date, completed)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
    `);
    this.stmtSave.run(log.id, log.habitId, log.date, log.completed ? 1 : 0);
  }

  public saveBatch(logs: HabitLog[]): void {
    this.stmtSave ??= this.db.prepare(`
      INSERT INTO habit_logs (id, habit_id, date, completed)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
    `);

    for (const l of logs) {
      this.stmtSave.run(l.id, l.habitId, l.date, l.completed ? 1 : 0);
    }
  }

  public deleteByHabitId(habitId: string): void {
    this.stmtDeleteByHabitId ??= this.db.prepare('DELETE FROM habit_logs WHERE habit_id = ?');
    this.stmtDeleteByHabitId.run(habitId);
  }

  public resetByDateRange(startDate: string, endDate: string): number {
    this.stmtResetByDateRange ??= this.db.prepare(`
      UPDATE habit_logs
      SET completed = 0
      WHERE date BETWEEN ? AND ?
    `);
    const res = this.stmtResetByDateRange.run(startDate, endDate);

    return Number(res.changes);
  }
}
