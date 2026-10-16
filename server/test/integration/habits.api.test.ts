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

  it('GET /api/habits should return empty list initially when no habits exist', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(200);
    expect(res.body.habits).toEqual([]);
    expect(res.body.weekDays).toHaveLength(7);
  });

  it('GET /api/habits/stats should return clean dashboard analytics with 0 habits', async () => {
    const res = await request(app).get('/api/habits/stats');
    expect(res.status).toBe(200);
    expect(res.body.perfectStreakDays).toBe(0);
    expect(res.body.weeklyConsistencyPct).toBe(0);
    expect(res.body.todayCompletedCount).toBe(0);
    expect(res.body.todayTotalCount).toBe(0);
    expect(res.body.weekDailySummary).toHaveLength(7);
  });

  it('GET /api/habits/heatmap should return empty grid structure', async () => {
    const res = await request(app).get('/api/habits/heatmap?weeks=10');
    expect(res.status).toBe(200);
    expect(res.body.weeks).toHaveLength(10);
    expect(res.body.totalActiveDays).toBe(0);
    expect(res.body.completionRatePct).toBe(0);
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
    // 1. Create a habit
    const createRes = await request(app)
      .post('/api/habits')
      .send({
        title: 'Academia',
        description: 'Treino de hipertrofia',
        color: '#10b981'
      });
    const habitId = createRes.body.id;

    // 2. Update it
    const res = await request(app)
      .put(`/api/habits/${habitId}`)
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
    const createRes = await request(app)
      .post('/api/habits')
      .send({ title: 'Leitura', description: 'Ler 10 páginas' });
    const habitId = createRes.body.id;

    const res = await request(app)
      .post(`/api/habits/${habitId}/toggle`)
      .send({ date: '2026-10-14' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completed');
    expect(res.body.completed).toBe(true);

    // Toggle back
    const res2 = await request(app)
      .post(`/api/habits/${habitId}/toggle`)
      .send({ date: '2026-10-14' });

    expect(res2.status).toBe(200);
    expect(res2.body.completed).toBe(false);
  });

  it('POST /api/habits/actions/mark-all-today should mark all habits for today', async () => {
    await request(app).post('/api/habits').send({ title: 'Hábito 1' });
    await request(app).post('/api/habits').send({ title: 'Hábito 2' });

    const res = await request(app).post('/api/habits/actions/mark-all-today');
    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(2);
  });

  it('POST /api/habits/actions/reset-week should clear current week marks', async () => {
    const res = await request(app).post('/api/habits/actions/reset-week');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resetCount');
  });

  it('DELETE /api/habits/:id should delete habit', async () => {
    const createRes = await request(app).post('/api/habits').send({ title: 'Hábito Para Deletar' });
    const habitId = createRes.body.id;

    const res = await request(app).delete(`/api/habits/${habitId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const getRes = await request(app).get('/api/habits');
    const ids = getRes.body.habits.map((h: any) => h.id);
    expect(ids).not.toContain(habitId);
  });
});
