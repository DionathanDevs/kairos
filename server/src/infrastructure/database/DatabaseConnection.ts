import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalDb: DatabaseSync | null = null;

export function getDatabase(customPath?: string): DatabaseSync {
  if (customPath) {
    if (customPath === ':memory:') {
      return new DatabaseSync(':memory:');
    }
    const dir = path.dirname(customPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = new DatabaseSync(customPath);
    db.exec('PRAGMA journal_mode = WAL;');
    return db;
  }

  if (!globalDb) {
    const envPath = process.env.DATABASE_PATH;
    const dbPath = envPath || path.resolve(__dirname, '../../../data/habits.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    globalDb = new DatabaseSync(dbPath);
    globalDb.exec('PRAGMA journal_mode = WAL;');
  }

  return globalDb;
}

export function resetGlobalDatabase(): void {
  globalDb = null;
}
