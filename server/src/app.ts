import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import type { Schema } from 'fast-json-stringify';
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

import { DomainError, ValidationError, NotFoundError } from './domain/errors/DomainError.js';
import { HabitController } from './presentation/controllers/HabitController.js';
import { createHabitRouter } from './presentation/routes/habitRoutes.js';
import { routeSchemas, serializers } from './presentation/schemas/habitSchemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateAppOptions {
  db?: DatabaseSync;
  runMigrations?: boolean;
}

export function createApp(options: CreateAppOptions = {}): { app: FastifyInstance; db: DatabaseSync } {
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

  // Fastify App
  const app = Fastify({ logger: false });

  // Reuse pre-compiled fast-json-stringify functions via WeakMap cache
  app.setSerializerCompiler(({ schema }) => {
    return serializers.compile(schema as Schema);
  });

  // Centralized Error Handler sending pre-serialized JSON string directly
  app.setErrorHandler((err: unknown, _req, reply) => {
    reply.type('application/json; charset=utf-8');

    if (err instanceof ValidationError) {
      reply.code(400).send(serializers.error({ error: err.message }));
      return;
    }
    if (err instanceof NotFoundError) {
      reply.code(404).send(serializers.error({ error: err.message }));
      return;
    }
    if (err instanceof DomainError) {
      reply.code(422).send(serializers.error({ error: err.message }));
      return;
    }
    if (typeof err === 'object' && err !== null && 'validation' in err) {
      const message = (err as { message?: string }).message || 'Dados de requisição inválidos.';
      reply.code(400).send(serializers.error({ error: message }));
      return;
    }

    console.error('[Fastify] Unexpected error:', err);
    const message = (err as { message?: string })?.message || 'Erro interno do servidor.';
    reply.code(500).send(serializers.error({ error: message }));
  });

  app.register(cors);

  // Health (synchronous handler)
  app.get('/api/health', { schema: routeSchemas.health }, (_req, reply) => {
    reply.send({ status: 'ok', time: new Date().toISOString() });
  });

  // API Routes
  app.register(createHabitRouter(habitController), { prefix: '/api/habits' });

  // Serve frontend static files if built
  const clientDistPath = process.env.CLIENT_DIST_PATH || path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.register(fastifyStatic, {
      root: clientDistPath,
      wildcard: false
    });

    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api')) {
        reply
          .code(404)
          .type('application/json; charset=utf-8')
          .send(serializers.error({ error: 'Rota não encontrada.' }));
        return;
      }
      return reply.sendFile('index.html');
    });
  }

  return { app, db };
}
