import { getDatabase } from '../DatabaseConnection.js';
import { MigrationRunner } from './MigrationRunner.js';

console.log('[Migration] Running database migrations...');
const db = getDatabase();
const runner = new MigrationRunner(db);
const applied = runner.run();

if (applied.length === 0) {
  console.log('[Migration] Database is up to date. No new migrations.');
} else {
  console.log(`[Migration] Applied ${applied.length} migration(s):`, applied);
}
