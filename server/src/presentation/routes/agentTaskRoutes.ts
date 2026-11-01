import { Router } from 'express';
import type { AgentTaskController } from '../controllers/AgentTaskController.js';

export function createAgentTaskRouter(controller: AgentTaskController): Router {
  const router = Router();

  // 2. Buscar a Próxima Tarefa Pendente na Fila (Agente Externo)
  router.post('/queue/next', controller.claimNext);

  // Listagem e CRUD de Tarefas de IA
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  // 1. Marcar uma Tarefa como Elegível para Automação
  router.patch('/:id/ready', controller.markReady);

  // 3. Registrar o Progresso ou Impedimento da Tarefa
  router.post('/:id/logs', controller.appendLog);

  // 4. Concluir a Tarefa com o Artefato Gerado (ex: Link do PR)
  router.post('/:id/complete', controller.complete);

  return router;
}
