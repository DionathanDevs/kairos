import { Router } from 'express';
import type { TaskController } from '../controllers/TaskController.js';

export function createTaskRouter(controller: TaskController): Router {
  const router = Router();

  router.get('/', controller.getTasks);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id/toggle', controller.toggle);
  router.delete('/:id', controller.delete);
  router.post('/actions/complete-all', controller.completeAll);
  router.post('/actions/clear-completed', controller.clearCompleted);

  return router;
}
