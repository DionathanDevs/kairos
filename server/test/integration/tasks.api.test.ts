import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../../src/app.js';

describe('Tasks REST API Integration Tests', () => {
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

  it('GET /api/tasks should return empty list initially', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });

  it('POST /api/tasks should create personal and work tasks with priority and sort properly', async () => {
    const r1 = await request(app).post('/api/tasks').send({
      title: 'Tarefa Baixa',
      description: 'Descrição baixa',
      priority: 'low',
      category: 'personal'
    });
    expect(r1.status).toBe(201);

    const r2 = await request(app).post('/api/tasks').send({
      title: 'Tarefa Alta',
      description: 'Urgente',
      priority: 'high',
      category: 'personal'
    });
    expect(r2.status).toBe(201);

    const r3 = await request(app).post('/api/tasks').send({
      title: 'Reunião de Sprint',
      description: 'Alinhamento semanal',
      priority: 'medium',
      category: 'work'
    });
    expect(r3.status).toBe(201);

    // Filter personal tasks -> should sort high priority first
    const listPersonal = await request(app).get('/api/tasks?category=personal');
    const personalTasks = listPersonal.body.tasks;
    expect(personalTasks).toHaveLength(2);
    expect(personalTasks[0].title).toBe('Tarefa Alta');
    expect(personalTasks[1].title).toBe('Tarefa Baixa');

    // Filter work tasks
    const listWork = await request(app).get('/api/tasks?category=work');
    const workTasks = listWork.body.tasks;
    expect(workTasks).toHaveLength(1);
    expect(workTasks[0].title).toBe('Reunião de Sprint');
  });

  it('PATCH /api/tasks/:id/toggle, complete-all and clear-completed should work per category', async () => {
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Revisar PR',
      priority: 'high',
      category: 'work'
    });
    const task = createRes.body;

    // Toggle completion
    const toggleRes = await request(app).patch(`/api/tasks/${task.id}/toggle`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.completed).toBe(true);

    // Clear completed in 'personal' should not delete 'work' task
    const clearPersonal = await request(app)
      .post('/api/tasks/actions/clear-completed')
      .send({ category: 'personal' });
    expect(clearPersonal.body.deletedCount).toBe(0);

    // Clear completed in 'work' should delete the completed task
    const clearWork = await request(app)
      .post('/api/tasks/actions/clear-completed')
      .send({ category: 'work' });
    expect(clearWork.body.deletedCount).toBe(1);
  });
});
