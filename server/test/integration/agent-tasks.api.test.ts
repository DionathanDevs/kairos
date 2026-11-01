import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../../src/app.js';

describe('AI Agent Tasks REST API Integration Tests', () => {
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

  it('should execute full 4-step AI Agent Task lifecycle (Mark Ready -> Claim Next -> Log Progress/Impediment -> Complete with Artifact)', async () => {
    // Create a low priority task already ready
    const lowRes = await request(app).post('/api/agent-tasks').send({
      title: 'Atualizar README do projeto',
      intent: 'Documentar novas variáveis de ambiente no README.md',
      repository_url: 'https://github.com/org/kairos-docs',
      target_branch: 'main',
      priority: 'low',
      status: 'ready'
    });
    expect(lowRes.status).toBe(201);

    // Create a high priority task in planning status
    const highRes = await request(app).post('/api/agent-tasks').send({
      title: 'Implementar webhook de alertas',
      intent: 'Criar endpoint POST /api/alerts com validação de payload',
      description: 'Seguir padrão Clean Architecture na camada presentation',
      acceptance_criteria: 'Testes de integração passando e cobertura de erros 400/422',
      repository_url: 'https://github.com/org/kairos-core',
      target_branch: 'develop',
      priority: 'high',
      status: 'planning'
    });
    expect(highRes.status).toBe(201);
    const highTaskId = highRes.body.id;
    expect(highRes.body.status).toBe('planning');

    // Step 1: Mark high priority task as eligible for automation (ready)
    const readyRes = await request(app).patch(`/api/agent-tasks/${highTaskId}/ready`);
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.status).toBe('ready');

    // Step 2: External agent claims next pending task from queue
    // Should pick the high priority task first!
    const claim1 = await request(app)
      .post('/api/agent-tasks/queue/next')
      .send({ agent_name: 'kairos-coder-bot' });
    expect(claim1.status).toBe(200);
    expect(claim1.body.task).toBeTruthy();
    expect(claim1.body.task.id).toBe(highTaskId);
    expect(claim1.body.task.status).toBe('in_progress');
    expect(claim1.body.task.agent_name).toBe('kairos-coder-bot');
    expect(claim1.body.task.intent).toBe('Criar endpoint POST /api/alerts com validação de payload');
    expect(claim1.body.task.repository_url).toBe('https://github.com/org/kairos-core');
    expect(claim1.body.task.acceptance_criteria).toBe(
      'Testes de integração passando e cobertura de erros 400/422'
    );

    // A second concurrent worker calling /queue/next should receive the next task (lowRes), not highTaskId
    const claim2 = await request(app)
      .post('/api/agent-tasks/queue/next')
      .send({ agent_name: 'kairos-coder-bot-2' });
    expect(claim2.status).toBe(200);
    expect(claim2.body.task.id).toBe(lowRes.body.id);

    // Queue is now empty of 'ready' tasks
    const claimEmpty = await request(app).post('/api/agent-tasks/queue/next');
    expect(claimEmpty.status).toBe(200);
    expect(claimEmpty.body.task).toBeNull();

    // Step 3a: External agent logs progress
    const progressRes = await request(app)
      .post(`/api/agent-tasks/${highTaskId}/logs`)
      .send({
        level: 'progress',
        message: 'Repositório clonado e branch feat/alerts criada.',
        metadata: 'commit: a1b2c3d'
      });
    expect(progressRes.status).toBe(201);
    expect(progressRes.body.task.status).toBe('in_progress');

    // Step 3b: External agent logs an impediment -> task becomes 'blocked'
    const impedimentRes = await request(app)
      .post(`/api/agent-tasks/${highTaskId}/logs`)
      .send({
        level: 'impediment',
        message: 'Dependência externa de schema ausente no repositório.',
        mark_blocked: true
      });
    expect(impedimentRes.status).toBe(201);
    expect(impedimentRes.body.task.status).toBe('blocked');

    // Step 4: External agent completes the task with the generated PR artifact
    const completeRes = await request(app)
      .post(`/api/agent-tasks/${highTaskId}/complete`)
      .send({
        artifact_url: 'https://github.com/org/kairos-core/pull/108',
        summary: 'Endpoint implementado com sucesso e 12 testes adicionados.',
        status: 'in_review'
      });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('in_review');
    expect(completeRes.body.artifact_url).toBe('https://github.com/org/kairos-core/pull/108');
    expect(completeRes.body.logs.length).toBeGreaterThanOrEqual(5);
  });

  it('should enforce AGENT_API_KEY on external agent endpoints when configured', async () => {
    const securedDb = new DatabaseSync(':memory:');
    const secured = createApp({
      db: securedDb,
      runMigrations: true,
      agentApiKey: 'secret-agent-token-999'
    });

    const created = await request(secured.app).post('/api/agent-tasks').send({
      title: 'Refatorar módulo de autenticação',
      intent: 'Aplicar comparação timingSafeEqual nos tokens',
      repository_url: 'https://github.com/org/kairos',
      status: 'ready'
    });
    expect(created.status).toBe(201);

    // Missing token -> 401
    const unauthClaim = await request(secured.app).post('/api/agent-tasks/queue/next');
    expect(unauthClaim.status).toBe(401);

    // Wrong token -> 401
    const wrongClaim = await request(secured.app)
      .post('/api/agent-tasks/queue/next')
      .set('x-agent-api-key', 'wrong-key');
    expect(wrongClaim.status).toBe(401);

    // Valid Bearer token -> 200
    const validClaim = await request(secured.app)
      .post('/api/agent-tasks/queue/next')
      .set('Authorization', 'Bearer secret-agent-token-999');
    expect(validClaim.status).toBe(200);
    expect(validClaim.body.task.id).toBe(created.body.id);

    securedDb.close();
  });
});
