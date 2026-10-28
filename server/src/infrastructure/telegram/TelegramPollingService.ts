import type { HandleTelegramUpdateUseCase } from '../../application/usecases/HandleTelegramUpdateUseCase.js';
import type { ITelegramApiClient } from './TelegramApiClient.js';

export class TelegramPollingService {
  private running = false;
  private lastOffset: number | undefined = undefined;
  private timer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private readonly apiClient: ITelegramApiClient,
    private readonly handleUpdateUseCase: HandleTelegramUpdateUseCase,
    private readonly pollingIntervalMs: number = 2000
  ) {}

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleNextPoll(0);
  }

  public stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async pollOnce(): Promise<number> {
    this.abortController = new AbortController();
    const updates = await this.apiClient.getUpdates(this.lastOffset, 0, this.abortController.signal);
    let processedCount = 0;

    for (const update of updates) {
      if (typeof update.update_id === 'number') {
        this.lastOffset = update.update_id + 1;
      }

      const result = this.handleUpdateUseCase.execute(update);
      if (result.handled && result.chatId && result.replyText) {
        await this.apiClient.sendMessage(result.chatId, result.replyText);
        processedCount++;
      }
    }

    return processedCount;
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      if (!this.running) return;
      try {
        await this.pollOnce();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes('aborted')) {
          console.error('[TelegramPollingService] Poll error:', message);
        }
      } finally {
        if (this.running) {
          this.scheduleNextPoll(this.pollingIntervalMs);
        }
      }
    }, delayMs);
  }
}
