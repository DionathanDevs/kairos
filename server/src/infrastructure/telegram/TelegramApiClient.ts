import type { TelegramUpdate } from '../../application/usecases/HandleTelegramUpdateUseCase.js';
import { sanitizeSensitiveText } from './TelegramBotConfig.js';

export interface ITelegramApiClient {
  getUpdates(offset?: number, timeoutSec?: number, signal?: AbortSignal): Promise<TelegramUpdate[]>;
  sendMessage(chatId: string | number, text: string): Promise<void>;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export class TelegramApiClient implements ITelegramApiClient {
  private readonly baseUrl: string;

  constructor(
    private readonly botToken: string,
    private readonly fetchFn: typeof fetch = globalThis.fetch
  ) {
    if (!botToken || !botToken.trim()) {
      throw new Error('TELEGRAM_BOT_TOKEN não configurado.');
    }
    this.baseUrl = `https://api.telegram.org/bot${botToken.trim()}`;
  }

  public async getUpdates(
    offset?: number,
    timeoutSec: number = 0,
    signal?: AbortSignal
  ): Promise<TelegramUpdate[]> {
    const params = new URLSearchParams();
    if (offset !== undefined) {
      params.set('offset', String(offset));
    }
    params.set('timeout', String(timeoutSec));
    params.set('allowed_updates', JSON.stringify(['message']));

    const url = `${this.baseUrl}/getUpdates?${params.toString()}`;
    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        signal
      });

      const body = (await response.json()) as TelegramApiResponse<TelegramUpdate[]>;
      if (!response.ok || !body.ok) {
        const desc = sanitizeSensitiveText(body.description || `HTTP ${response.status}`, [this.botToken]);
        throw new Error(`Falha ao buscar updates do Telegram: ${desc}`);
      }

      return body.result || [];
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      throw new Error(sanitizeSensitiveText(rawMessage, [this.botToken]));
    }
  }

  public async sendMessage(chatId: string | number, text: string): Promise<void> {
    const url = `${this.baseUrl}/sendMessage`;
    try {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text
        })
      });

      const body = (await response.json()) as TelegramApiResponse<unknown>;
      if (!response.ok || !body.ok) {
        const desc = sanitizeSensitiveText(body.description || `HTTP ${response.status}`, [this.botToken]);
        throw new Error(`Falha ao enviar mensagem no Telegram: ${desc}`);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      throw new Error(sanitizeSensitiveText(rawMessage, [this.botToken]));
    }
  }
}
