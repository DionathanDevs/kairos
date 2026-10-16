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

  it('should run all schema migrations and create tables', () => {
    const runner = new MigrationRunner(db);
    const applied = runner.run();

    expect(applied).toContain('001_create_habits_table.sql');
    expect(applied).toContain('002_create_habit_logs_table.sql');

    // Verify _migrations table
    const migrationRows = db.prepare('SELECT name FROM _migrations').all() as unknown as { name: string }[];
    expect(migrationRows).toHaveLength(2);

    // Verify habits table is created and empty (no mock data)
    const habitRows = db.prepare('SELECT * FROM habits').all() as unknown as { id: string; title: string }[];
    expect(habitRows).toHaveLength(0);

    // Verify habit_logs table is created and empty
    const logRows = db.prepare('SELECT * FROM habit_logs').all() as unknown as { id: string }[];
    expect(logRows).toHaveLength(0);
  });

  it('should be idempotent and not re-apply existing migrations', () => {
    const runner = new MigrationRunner(db);
    runner.run();

    // Run a second time
    const secondRun = runner.run();
    expect(secondRun).toHaveLength(0);
  });
});
