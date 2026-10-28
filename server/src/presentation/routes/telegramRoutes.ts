import { Router } from 'express';
import type { TelegramWebhookController } from '../controllers/TelegramWebhookController.js';

export function createTelegramRouter(controller: TelegramWebhookController): Router {
  const router = Router();
  router.post('/webhook', controller.handleWebhook);
  return router;
}
