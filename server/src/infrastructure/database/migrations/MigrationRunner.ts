import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MigrationRunner {
  private db: DatabaseSync;
  private migrationsDir: string;

  constructor(db: DatabaseSync, migrationsDir?: string) {
    this.db = db;
    // Default migrations directory is server/migrations or via MIGRATIONS_DIR
    this.migrationsDir = migrationsDir || process.env.MIGRATIONS_DIR || path.resolve(__dirname, '../../../../migrations');
  }

  public run(): string[] {
    // 1. Ensure _migrations metadata table exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
    `);

    // 2. Read already applied migrations
    const appliedRows = this.db.prepare('SELECT name FROM _migrations').all() as unknown as { name: string }[];
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Find migration files
    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`[MigrationRunner] Directory not found: ${this.migrationsDir}`);
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const newlyApplied: string[] = [];
    const insertStmt = this.db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)');

    for (const file of files) {
      if (!appliedSet.has(file)) {
        const filePath = path.join(this.migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Execute migration
        this.db.exec(sql);

        // Record as applied
        insertStmt.run(file, new Date().toISOString());
        newlyApplied.push(file);
        console.log(`[MigrationRunner] Successfully applied: ${file}`);
      }
    }

    return newlyApplied;
  }
}
