import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import type {
  HandleTelegramUpdateUseCase,
  TelegramUpdate
} from '../../application/usecases/HandleTelegramUpdateUseCase.js';
import type { ITelegramApiClient } from '../../infrastructure/telegram/TelegramApiClient.js';

export class TelegramWebhookController {
  constructor(
    private readonly handleUpdateUseCase: HandleTelegramUpdateUseCase,
    private readonly webhookSecret: string,
    private readonly apiClient?: ITelegramApiClient
  ) {}

  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.webhookSecret) {
        res.status(503).json({ error: 'Webhook do Telegram não está habilitado.' });
        return;
      }

      const incomingSecret = req.header('x-telegram-bot-api-secret-token') || '';
      if (!this.isValidSecret(incomingSecret, this.webhookSecret)) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
      }

      const update = req.body as TelegramUpdate;
      if (!update || typeof update !== 'object' || typeof update.update_id !== 'number') {
        res.status(400).json({ error: 'Payload de update inválido.' });
        return;
      }

      const result = this.handleUpdateUseCase.execute(update);

      if (result.handled && result.chatId && result.replyText && this.apiClient) {
        await this.apiClient.sendMessage(result.chatId, result.replyText);
      }

      res.status(200).json({
        ok: true,
        handled: result.handled
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro interno ao processar webhook.';
      console.error('[TelegramWebhookController] Error:', msg);
      res.status(500).json({ error: 'Erro interno ao processar webhook.' });
    }
  };

  private isValidSecret(provided: string, expected: string): boolean {
    if (!provided || !expected) return false;
    const providedBuf = Buffer.from(provided, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (providedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  }
}
