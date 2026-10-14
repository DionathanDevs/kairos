import { Router } from 'express';
import type { HabitController } from '../controllers/HabitController.js';

export function createHabitRouter(controller: HabitController): Router {
  const router = Router();

  router.get('/', controller.getHabits);
  router.get('/stats', controller.getStats);
  router.get('/heatmap', controller.getHeatmap);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);
  router.post('/:id/toggle', controller.toggle);
  router.post('/actions/mark-all-today', controller.markAllToday);
  router.post('/actions/reset-week', controller.resetWeek);

  return router;
}
