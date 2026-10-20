import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('Habits REST API Integration Tests (Fastify + fast-json-stringify)', () => {
  let db: DatabaseSync;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    const instance = createApp({ db, runMigrations: true });
    app = instance.app;
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.time).toBeDefined();
  });

  it('GET /api/habits should return empty list initially when no habits exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/habits'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.habits).toEqual([]);
    expect(body.weekDays).toHaveLength(7);
  });

  it('GET /api/habits/stats should return clean dashboard analytics with 0 habits', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/habits/stats'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.perfectStreakDays).toBe(0);
    expect(body.weeklyConsistencyPct).toBe(0);
    expect(body.todayCompletedCount).toBe(0);
    expect(body.todayTotalCount).toBe(0);
    expect(body.weekDailySummary).toHaveLength(7);
  });

  it('GET /api/habits/heatmap should return empty grid structure', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/habits/heatmap?weeks=10'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.weeks).toHaveLength(10);
    expect(body.totalActiveDays).toBe(0);
    expect(body.completionRatePct).toBe(0);
  });

  it('POST /api/habits should create a new habit with 201 Created', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: {
        title: 'Beber 2L de Água',
        description: 'Manter hidratação ao longo do dia',
        color: '#0ea5e9'
      }
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.title).toBe('Beber 2L de Água');
    expect(body.color).toBe('#0ea5e9');
    expect(body.id).toBeDefined();
  });

  it('POST /api/habits should return 400 Bad Request if title is missing or empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: { title: '   ' }
    });
    const body = res.json();

    expect(res.statusCode).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('PUT /api/habits/:id should update existing habit', async () => {
    // 1. Create a habit
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: {
        title: 'Academia',
        description: 'Treino de hipertrofia',
        color: '#10b981'
      }
    });
    const habitId = createRes.json().id;

    // 2. Update it
    const res = await app.inject({
      method: 'PUT',
      url: `/api/habits/${habitId}`,
      payload: {
        title: 'Academia & Cardio',
        description: '60 min de treino + 15 min cardio',
        color: '#10b981'
      }
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.title).toBe('Academia & Cardio');
    expect(body.description).toBe('60 min de treino + 15 min cardio');
  });

  it('PUT /api/habits/:id should return 404 for non-existent habit', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/habits/non-existent-habit-id',
      payload: { title: 'Novo Título' }
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/habits/:id/toggle should toggle completion for date', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: { title: 'Leitura', description: 'Ler 10 páginas' }
    });
    const habitId = createRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/habits/${habitId}/toggle`,
      payload: { date: '2026-10-14' }
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('completed');
    expect(body.completed).toBe(true);

    // Toggle back
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/habits/${habitId}/toggle`,
      payload: { date: '2026-10-14' }
    });
    const body2 = res2.json();

    expect(res2.statusCode).toBe(200);
    expect(body2.completed).toBe(false);
  });

  it('POST /api/habits/actions/mark-all-today should mark all habits for today', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: { title: 'Hábito 1' }
    });
    await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: { title: 'Hábito 2' }
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/habits/actions/mark-all-today'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.updatedCount).toBe(2);
  });

  it('POST /api/habits/actions/reset-week should clear current week marks', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/habits/actions/reset-week'
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('resetCount');
  });

  it('DELETE /api/habits/:id should delete habit', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/habits',
      payload: { title: 'Hábito Para Deletar' }
    });
    const habitId = createRes.json().id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/habits/${habitId}`
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);

    // Verify it is gone
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/habits'
    });
    const ids = getRes.json().habits.map((h: any) => h.id);
    expect(ids).not.toContain(habitId);
  });
});
