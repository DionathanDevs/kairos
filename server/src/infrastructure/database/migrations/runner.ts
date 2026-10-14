import { getDatabase } from '../DatabaseConnection.js';
import { MigrationRunner } from './MigrationRunner.js';

console.log('🔄 Running database migrations...');
const db = getDatabase();
const runner = new MigrationRunner(db);
const applied = runner.run();

if (applied.length === 0) {
  console.log('✨ Database is up to date. No new migrations.');
} else {
  console.log(`✅ Applied ${applied.length} migration(s):`, applied);
}
