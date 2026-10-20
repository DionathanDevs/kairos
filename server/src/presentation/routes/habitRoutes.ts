import type { FastifyInstance } from 'fastify';
import type { HabitController } from '../controllers/HabitController.js';
import { routeSchemas } from '../schemas/habitSchemas.js';

export function createHabitRouter(controller: HabitController) {
  return async function habitRoutesPlugin(app: FastifyInstance): Promise<void> {
    app.get('/', { schema: routeSchemas.getHabits }, controller.getHabits);
    app.get('/stats', { schema: routeSchemas.getStats }, controller.getStats);
    app.get('/heatmap', { schema: routeSchemas.getHeatmap }, controller.getHeatmap);
    app.post('/', { schema: routeSchemas.createHabit }, controller.create);
    app.put('/:id', { schema: routeSchemas.updateHabit }, controller.update);
    app.delete('/:id', { schema: routeSchemas.deleteHabit }, controller.delete);
    app.post('/:id/toggle', { schema: routeSchemas.toggleHabit }, controller.toggle);
    app.post('/actions/mark-all-today', { schema: routeSchemas.markAllToday }, controller.markAllToday);
    app.post('/actions/reset-week', { schema: routeSchemas.resetWeek }, controller.resetWeek);
  };
}
