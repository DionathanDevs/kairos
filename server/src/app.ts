import express, { Express } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';

import { getDatabase } from './infrastructure/database/DatabaseConnection.js';
import { MigrationRunner } from './infrastructure/database/migrations/MigrationRunner.js';
import { SQLiteHabitRepository } from './infrastructure/database/repositories/SQLiteHabitRepository.js';
import { SQLiteHabitLogRepository } from './infrastructure/database/repositories/SQLiteHabitLogRepository.js';

import { GetHabitsWithWeekUseCase } from './application/usecases/GetHabitsWithWeekUseCase.js';
import { GetDashboardStatsUseCase } from './application/usecases/GetDashboardStatsUseCase.js';
import { GetHeatmapUseCase } from './application/usecases/GetHeatmapUseCase.js';
import { CreateHabitUseCase } from './application/usecases/CreateHabitUseCase.js';
import { UpdateHabitUseCase } from './application/usecases/UpdateHabitUseCase.js';
import { DeleteHabitUseCase } from './application/usecases/DeleteHabitUseCase.js';
import { ToggleHabitLogUseCase } from './application/usecases/ToggleHabitLogUseCase.js';
import { MarkAllTodayUseCase } from './application/usecases/MarkAllTodayUseCase.js';
import { ResetWeekUseCase } from './application/usecases/ResetWeekUseCase.js';

import { HabitController } from './presentation/controllers/HabitController.js';
import { createHabitRouter } from './presentation/routes/habitRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateAppOptions {
  db?: DatabaseSync;
  runMigrations?: boolean;
}

export function createApp(options: CreateAppOptions = {}): { app: Express; db: DatabaseSync } {
  const db = options.db || getDatabase();

  if (options.runMigrations !== false) {
    const runner = new MigrationRunner(db);
    runner.run();
  }

  // Repositories
  const habitRepo = new SQLiteHabitRepository(db);
  const habitLogRepo = new SQLiteHabitLogRepository(db);

  // Use Cases
  const getHabitsWithWeekUseCase = new GetHabitsWithWeekUseCase(habitRepo, habitLogRepo);
  const getDashboardStatsUseCase = new GetDashboardStatsUseCase(habitRepo, habitLogRepo);
  const getHeatmapUseCase = new GetHeatmapUseCase(habitRepo, habitLogRepo);
  const createHabitUseCase = new CreateHabitUseCase(habitRepo);
  const updateHabitUseCase = new UpdateHabitUseCase(habitRepo);
  const deleteHabitUseCase = new DeleteHabitUseCase(habitRepo, habitLogRepo);
  const toggleHabitLogUseCase = new ToggleHabitLogUseCase(habitRepo, habitLogRepo);
  const markAllTodayUseCase = new MarkAllTodayUseCase(habitRepo, habitLogRepo);
  const resetWeekUseCase = new ResetWeekUseCase(habitLogRepo);

  // Controller
  const habitController = new HabitController(
    getHabitsWithWeekUseCase,
    getDashboardStatsUseCase,
    getHeatmapUseCase,
    createHabitUseCase,
    updateHabitUseCase,
    deleteHabitUseCase,
    toggleHabitLogUseCase,
    markAllTodayUseCase,
    resetWeekUseCase
  );

  // Express App
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/habits', createHabitRouter(habitController));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve frontend static files if built
  const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return { app, db };
}
