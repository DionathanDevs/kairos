import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Habit, HabitWithWeekLogs, DashboardStats, HeatmapDay, DailySummary } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'habits.db');
export const db = new DatabaseSync(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#10b981',
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(habit_id, date),
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_date ON habit_logs(date);
    CREATE INDEX IF NOT EXISTS idx_logs_habit_id ON habit_logs(habit_id);
  `);

  seedInitialDataIfEmpty();
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function getCurrentWeekDates(refDate: Date = new Date()): { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[] {
  const todayStr = formatDate(refDate);
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);

  const dayNames: ('Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom')[] = [
    'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
  ];

  return dayNames.map((name, i) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = formatDate(cur);
    return {
      name,
      date: dateStr,
      isToday: dateStr === todayStr
    };
  });
}

function seedInitialDataIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
  if (countRow.count > 0) {
    return;
  }

  const initialHabits = [
    {
      id: 'habit-academia',
      title: 'Academia',
      description: 'Treino hipertrofia / força (50 min)',
      color: '#10b981',
      order_index: 0,
      // Pattern from screenshot: Seg: 1, Ter: 1, Qua: 0, Qui: 1, Sex: 1, Sáb: 1, Dom: 0
      weekPattern: [1, 1, 0, 1, 1, 1, 0]
    },
    {
      id: 'habit-creatina',
      title: 'Creatina',
      description: 'Dose diária de 5g',
      color: '#10b981',
      order_index: 1,
      // Seg: 1, Ter: 1, Qua: 1, Qui: 1, Sex: 1, Sáb: 1, Dom: 1
      weekPattern: [1, 1, 1, 1, 1, 1, 1]
    },
    {
      id: 'habit-dev',
      title: 'Estudos Desenvolvimento',
      description: '1h30 de código e projetos',
      color: '#10b981',
      order_index: 2,
      // Seg: 1, Ter: 1, Qua: 1, Qui: 1, Sex: 1, Sáb: 0, Dom: 1
      weekPattern: [1, 1, 1, 1, 1, 0, 1]
    },
    {
      id: 'habit-ingles',
      title: 'Estudos Inglês',
      description: '30 min de prática ativa',
      color: '#10b981',
      order_index: 3,
      // Seg: 1, Ter: 0, Qua: 1, Qui: 1, Sex: 1, Sáb: 1, Dom: 0
      weekPattern: [1, 0, 1, 1, 1, 1, 0]
    }
  ];

  const now = new Date();
  const insertHabit = db.prepare(`
    INSERT INTO habits (id, title, description, color, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT INTO habit_logs (id, habit_id, date, completed)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
  `);

  for (const h of initialHabits) {
    insertHabit.run(h.id, h.title, h.description, h.color, h.order_index, now.toISOString());
  }

  // Seed current week logs
  const weekDays = getCurrentWeekDates(now);
  for (const h of initialHabits) {
    weekDays.forEach((wd, idx) => {
      const completed = h.weekPattern[idx] ?? 0;
      insertLog.run(`${h.id}_${wd.date}`, h.id, wd.date, completed);
    });
  }

  // Also seed past ~16 weeks with realistic habit data for the GitHub contribution heatmap
  const pastDays = 120; // ~4 months
  for (let i = 1; i <= pastDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDate(d);
    
    // Skip if it's already in the current week
    if (weekDays.some(wd => wd.date === dateStr)) continue;

    for (const h of initialHabits) {
      // Deterministic pseudorandom based on date and habit id
      const charCode = (dateStr.charCodeAt(9) + h.id.length * 7 + i * 3) % 10;
      const completed = charCode > 2 ? 1 : 0; // ~70-80% completion rate
      insertLog.run(`${h.id}_${dateStr}`, h.id, dateStr, completed);
    }
  }
}

export function getAllHabitsWithWeek(): { habits: HabitWithWeekLogs[]; weekDays: { name: string; date: string; isToday: boolean }[] } {
  const weekDays = getCurrentWeekDates();
  const habitRows = db.prepare('SELECT * FROM habits ORDER BY order_index ASC, created_at ASC').all() as unknown as Habit[];

  const getLogsStmt = db.prepare(`
    SELECT date, completed FROM habit_logs 
    WHERE habit_id = ? AND date BETWEEN ? AND ?
  `);

  const startDate = weekDays[0].date;
  const endDate = weekDays[6].date;

  const habits: HabitWithWeekLogs[] = habitRows.map(habit => {
    const logs = getLogsStmt.all(habit.id, startDate, endDate) as { date: string; completed: number }[];
    const logMap = new Map<string, number>();
    for (const log of logs) {
      logMap.set(log.date, log.completed);
    }

    let weekCompletedCount = 0;
    const days = weekDays.map(wd => {
      const comp = (logMap.get(wd.date) === 1);
      if (comp) weekCompletedCount++;
      return {
        dayName: wd.name,
        date: wd.date,
        completed: comp,
        isToday: wd.isToday
      };
    });

    return {
      ...habit,
      days,
      weekCompletedCount
    };
  });

  return { habits, weekDays };
}

export function createHabit(title: string, description: string = '', color: string = '#10b981'): Habit {
  const id = `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const orderRow = db.prepare('SELECT MAX(order_index) as max_idx FROM habits').get() as { max_idx: number | null };
  const nextOrder = (orderRow?.max_idx ?? -1) + 1;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO habits (id, title, description, color, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title.trim(), description.trim(), color, nextOrder, now);

  return {
    id,
    title: title.trim(),
    description: description.trim(),
    color,
    order_index: nextOrder,
    created_at: now
  };
}

export function updateHabit(id: string, title: string, description: string, color?: string): Habit | null {
  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(id) as Habit | undefined;
  if (!existing) return null;

  const newColor = color || existing.color;
  db.prepare(`
    UPDATE habits 
    SET title = ?, description = ?, color = ?
    WHERE id = ?
  `).run(title.trim(), description.trim(), newColor, id);

  return {
    ...existing,
    title: title.trim(),
    description: description.trim(),
    color: newColor
  };
}

export function deleteHabit(id: string): boolean {
  const res = db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  db.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(id);
  return Number(res.changes) > 0;
}

export function toggleHabit(habitId: string, date: string): { completed: boolean } {
  const existing = db.prepare(`
    SELECT completed FROM habit_logs WHERE habit_id = ? AND date = ?
  `).get(habitId, date) as unknown as { completed: number } | undefined;

  const newStatus = existing && existing.completed === 1 ? 0 : 1;
  const logId = `${habitId}_${date}`;

  db.prepare(`
    INSERT INTO habit_logs (id, habit_id, date, completed)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
  `).run(logId, habitId, date, newStatus);

  return { completed: newStatus === 1 };
}

export function markAllToday(): { updatedCount: number } {
  const todayStr = formatDate(new Date());
  const habits = db.prepare('SELECT id FROM habits').all() as unknown as { id: string }[];

  const stmt = db.prepare(`
    INSERT INTO habit_logs (id, habit_id, date, completed)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1
  `);

  for (const h of habits) {
    stmt.run(`${h.id}_${todayStr}`, h.id, todayStr);
  }

  return { updatedCount: habits.length };
}

export function resetWeek(): { resetCount: number } {
  const weekDays = getCurrentWeekDates();
  const startDate = weekDays[0].date;
  const endDate = weekDays[6].date;

  const res = db.prepare(`
    UPDATE habit_logs
    SET completed = 0
    WHERE date BETWEEN ? AND ?
  `).run(startDate, endDate);

  return { resetCount: Number(res.changes) };
}

export function getStats(): DashboardStats {
  const weekDays = getCurrentWeekDates();
  const todayStr = formatDate(new Date());
  const habits = db.prepare('SELECT id FROM habits').all() as { id: string }[];
  const totalHabits = habits.length;

  if (totalHabits === 0) {
    return {
      perfectStreakDays: 0,
      weeklyConsistencyPct: 0,
      todayCompletedCount: 0,
      todayTotalCount: 0,
      todayDayName: weekDays.find(w => w.isToday)?.name || 'Dom',
      weekDailySummary: weekDays.map(wd => ({
        dayName: wd.name,
        date: wd.date,
        completedCount: 0,
        totalHabits: 0,
        percentage: 0,
        isToday: wd.isToday
      }))
    };
  }

  // Get logs for the current week
  const startDate = weekDays[0].date;
  const endDate = weekDays[6].date;
  const weekLogs = db.prepare(`
    SELECT date, SUM(completed) as completedCount
    FROM habit_logs
    WHERE date BETWEEN ? AND ?
    GROUP BY date
  `).all(startDate, endDate) as { date: string; completedCount: number }[];

  const countMap = new Map<string, number>();
  for (const log of weekLogs) {
    countMap.set(log.date, Number(log.completedCount));
  }

  let totalWeekCompleted = 0;
  const weekDailySummary: DailySummary[] = weekDays.map(wd => {
    const completedCount = countMap.get(wd.date) ?? 0;
    totalWeekCompleted += completedCount;
    const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    return {
      dayName: wd.name,
      date: wd.date,
      completedCount,
      totalHabits,
      percentage,
      isToday: wd.isToday
    };
  });

  // Consistency = (Total Completed in Week) / (Total Habits * 7) * 100
  const maxPossibleWeek = totalHabits * 7;
  const weeklyConsistencyPct = Math.round((totalWeekCompleted / maxPossibleWeek) * 100);

  // Today's completed count
  const todayRow = db.prepare(`
    SELECT SUM(completed) as count
    FROM habit_logs
    WHERE date = ?
  `).get(todayStr) as { count: number | null };
  const todayCompletedCount = Number(todayRow?.count ?? 0);

  // Calculate perfect streak (days in sequence up to yesterday/today where 100% of habits were completed)
  let perfectStreakDays = 0;
  const checkDate = new Date();
  
  // If today is 100%, count today, otherwise start checking from yesterday backwards
  const isTodayComplete = todayCompletedCount >= totalHabits && totalHabits > 0;
  if (isTodayComplete) {
    perfectStreakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const curDateStr = formatDate(checkDate);
    const dayStat = db.prepare(`
      SELECT SUM(completed) as count
      FROM habit_logs
      WHERE date = ?
    `).get(curDateStr) as { count: number | null };

    const compCount = Number(dayStat?.count ?? 0);
    if (compCount >= totalHabits && totalHabits > 0) {
      perfectStreakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
      // Safety limit
      if (perfectStreakDays > 365) break;
    } else {
      break;
    }
  }

  const todayDayName = weekDays.find(w => w.isToday)?.name || 'Dom';

  return {
    perfectStreakDays,
    weeklyConsistencyPct,
    todayCompletedCount,
    todayTotalCount: totalHabits,
    todayDayName,
    weekDailySummary
  };
}

export function getHeatmap(weeksCount: number = 20): { weeks: HeatmapDay[][]; totalActiveDays: number; completionRatePct: number } {
  const habitsCountRow = db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
  const totalHabits = habitsCountRow.count;

  // We want `weeksCount` full weeks, ending on Sunday of current week
  const currentWeekDays = getCurrentWeekDates();
  const sunday = parseDate(currentWeekDays[6].date); // current week Sunday

  // Total days to fetch: weeksCount * 7
  const totalDays = weeksCount * 7;
  const firstMonday = new Date(sunday);
  firstMonday.setDate(sunday.getDate() - totalDays + 1);

  const startStr = formatDate(firstMonday);
  const endStr = formatDate(sunday);

  const logs = db.prepare(`
    SELECT date, SUM(completed) as comp_count
    FROM habit_logs
    WHERE date BETWEEN ? AND ?
    GROUP BY date
  `).all(startStr, endStr) as { date: string; comp_count: number }[];

  const countMap = new Map<string, number>();
  for (const log of logs) {
    countMap.set(log.date, Number(log.comp_count));
  }

  const weeks: HeatmapDay[][] = [];
  let curDate = new Date(firstMonday);
  let totalActiveDays = 0;
  let totalHabitCompletions = 0;

  for (let w = 0; w < weeksCount; w++) {
    const week: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(curDate);
      const count = countMap.get(dateStr) ?? 0;
      
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalHabits > 0 && count > 0) {
        totalActiveDays++;
        totalHabitCompletions += count;
        const ratio = count / totalHabits;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.50) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }

      week.push({
        date: dateStr,
        count,
        total: totalHabits,
        level
      });

      curDate.setDate(curDate.getDate() + 1);
    }
    weeks.push(week);
  }

  const totalPossible = totalDays * totalHabits;
  const completionRatePct = totalPossible > 0 ? Math.round((totalHabitCompletions / totalPossible) * 100) : 0;

  return { weeks, totalActiveDays, completionRatePct };
}
