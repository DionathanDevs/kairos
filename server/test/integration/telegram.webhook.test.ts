import { jest } from '@jest/globals';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../../src/app.js';
import type { ITelegramApiClient } from '../../src/infrastructure/telegram/TelegramApiClient.js';

describe('Telegram Bot Webhook Integration Tests', () => {
  let db: DatabaseSync;
  let app: any;
  let mockTelegramClient: ITelegramApiClient;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    mockTelegramClient = {
      getUpdates: jest.fn(async () => []),
      sendMessage: jest.fn(async () => {})
    };

    const instance = createApp({
      db,
      runMigrations: true,
      telegramConfig: {
        enabled: true,
        botToken: 'mock-bot-token',
        allowedChatIds: new Set(['777888999']),
        mode: 'webhook',
        pollingIntervalMs: 2000,
        webhookSecret: 'test-webhook-secret-header'
      },
      telegramApiClient: mockTelegramClient
    });
    app = instance.app;
  });

  afterEach(() => {
    db.close();
  });

  it('POST /api/telegram/webhook should reject requests without valid secret header (401)', async () => {
    const res = await request(app)
      .post('/api/telegram/webhook')
      .send({
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 777888999, type: 'private' },
          text: 'Nova tarefa'
        }
      });

    expect(res.status).toBe(401);
  });

  it('POST /api/telegram/webhook should ignore unauthorized chat_id and not create tasks', async () => {
    const res = await request(app)
      .post('/api/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret-header')
      .send({
        update_id: 2,
        message: {
          message_id: 2,
          chat: { id: 123456789, type: 'private' },
          text: 'Tentativa não autorizada'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.handled).toBe(false);

    const tasksRes = await request(app).get('/api/tasks');
    expect(tasksRes.body.tasks).toHaveLength(0);
  });

  it('POST /api/telegram/webhook should create task in the app database when chat_id and secret are valid', async () => {
    const res = await request(app)
      .post('/api/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret-header')
      .send({
        update_id: 3,
        message: {
          message_id: 3,
          chat: { id: 777888999, type: 'private' },
          text: 'Deploy da versão 1.2 #work !alta | Validar variáveis no servidor'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.handled).toBe(true);
    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      '777888999',
      expect.stringContaining('Tarefa criada com sucesso')
    );

    const tasksRes = await request(app).get('/api/tasks?category=work');
    expect(tasksRes.status).toBe(200);
    expect(tasksRes.body.tasks).toHaveLength(1);
    expect(tasksRes.body.tasks[0]).toMatchObject({
      title: 'Deploy da versão 1.2',
      description: 'Validar variáveis no servidor',
      priority: 'high',
      category: 'work',
      completed: false
    });
  });
});
