import { DatabaseSync } from 'node:sqlite';
import { MigrationRunner } from '../../src/infrastructure/database/migrations/MigrationRunner.js';

describe('Migrations Integration Test', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('should run all migrations and create schema + seeds', () => {
    const runner = new MigrationRunner(db);
    const applied = runner.run();

    expect(applied).toContain('001_create_habits_table.sql');
    expect(applied).toContain('002_create_habit_logs_table.sql');
    expect(applied).toContain('003_seed_default_habits.sql');

    // Verify _migrations table
    const migrationRows = db.prepare('SELECT name FROM _migrations').all() as unknown as { name: string }[];
    expect(migrationRows).toHaveLength(3);

    // Verify habits table contains default habits
    const habitRows = db.prepare('SELECT * FROM habits').all() as unknown as { id: string; title: string }[];
    expect(habitRows.length).toBeGreaterThanOrEqual(4);
    const titles = habitRows.map((h) => h.title);
    expect(titles).toContain('Academia');
    expect(titles).toContain('Creatina');
    expect(titles).toContain('Estudos Desenvolvimento');
    expect(titles).toContain('Estudos Inglês');
  });

  it('should be idempotent and not re-apply existing migrations', () => {
    const runner = new MigrationRunner(db);
    runner.run();

    // Run a second time
    const secondRun = runner.run();
    expect(secondRun).toHaveLength(0);
  });
});
