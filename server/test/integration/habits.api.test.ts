import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../../src/app.js';

describe('Habits REST API Integration Tests', () => {
  let db: DatabaseSync;
  let app: any;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    const instance = createApp({ db, runMigrations: true });
    app = instance.app;
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.time).toBeDefined();
  });

  it('GET /api/habits should list habits and 7-day week status', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(200);
    expect(res.body.habits).toBeInstanceOf(Array);
    expect(res.body.habits.length).toBeGreaterThanOrEqual(4);
    expect(res.body.weekDays).toHaveLength(7);
  });

  it('GET /api/habits/stats should return dashboard analytics', async () => {
    const res = await request(app).get('/api/habits/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('perfectStreakDays');
    expect(res.body).toHaveProperty('weeklyConsistencyPct');
    expect(res.body).toHaveProperty('todayCompletedCount');
    expect(res.body).toHaveProperty('todayTotalCount');
    expect(res.body.weekDailySummary).toHaveLength(7);
  });

  it('GET /api/habits/heatmap should return contribution grid structure', async () => {
    const res = await request(app).get('/api/habits/heatmap?weeks=10');
    expect(res.status).toBe(200);
    expect(res.body.weeks).toHaveLength(10);
    expect(res.body).toHaveProperty('totalActiveDays');
    expect(res.body).toHaveProperty('completionRatePct');
  });

  it('POST /api/habits should create a new habit with 201 Created', async () => {
    const res = await request(app)
      .post('/api/habits')
      .send({
        title: 'Beber 2L de Água',
        description: 'Manter hidratação ao longo do dia',
        color: '#0ea5e9'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Beber 2L de Água');
    expect(res.body.color).toBe('#0ea5e9');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/habits should return 400 Bad Request if title is missing or empty', async () => {
    const res = await request(app)
      .post('/api/habits')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PUT /api/habits/:id should update existing habit', async () => {
    const res = await request(app)
      .put('/api/habits/habit-academia')
      .send({
        title: 'Academia & Cardio',
        description: '60 min de treino + 15 min cardio',
        color: '#10b981'
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Academia & Cardio');
    expect(res.body.description).toBe('60 min de treino + 15 min cardio');
  });

  it('PUT /api/habits/:id should return 404 for non-existent habit', async () => {
    const res = await request(app)
      .put('/api/habits/non-existent-habit-id')
      .send({ title: 'Novo Título' });

    expect(res.status).toBe(404);
  });

  it('POST /api/habits/:id/toggle should toggle completion for date', async () => {
    const res = await request(app)
      .post('/api/habits/habit-academia/toggle')
      .send({ date: '2026-10-14' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completed');
    expect(res.body.completed).toBe(true);

    // Toggle back
    const res2 = await request(app)
      .post('/api/habits/habit-academia/toggle')
      .send({ date: '2026-10-14' });

    expect(res2.status).toBe(200);
    expect(res2.body.completed).toBe(false);
  });

  it('POST /api/habits/actions/mark-all-today should mark all habits for today', async () => {
    const res = await request(app).post('/api/habits/actions/mark-all-today');
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBeGreaterThanOrEqual(4);
  });

  it('POST /api/habits/actions/reset-week should clear current week marks', async () => {
    const res = await request(app).post('/api/habits/actions/reset-week');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resetCount');
  });

  it('DELETE /api/habits/:id should delete habit', async () => {
    const res = await request(app).delete('/api/habits/habit-academia');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const getRes = await request(app).get('/api/habits');
    const ids = getRes.body.habits.map((h: any) => h.id);
    expect(ids).not.toContain('habit-academia');
  });
});
