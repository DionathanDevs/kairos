import { createApp } from './app.js';
import { TelegramApiClient } from './infrastructure/telegram/TelegramApiClient.js';
import { TelegramPollingService } from './infrastructure/telegram/TelegramPollingService.js';

const PORT = process.env.PORT || 3001;
const { app, telegramConfig, handleTelegramUpdateUseCase } = createApp();

let pollingService: TelegramPollingService | null = null;

if (telegramConfig.enabled) {
  if (!telegramConfig.botToken) {
    console.warn('[TelegramBot] TELEGRAM_BOT_ENABLED=true, mas TELEGRAM_BOT_TOKEN não foi definido no .env.');
  } else if (telegramConfig.allowedChatIds.size === 0) {
    console.warn('[TelegramBot] TELEGRAM_ALLOWED_CHAT_IDS está vazio. Defina ao menos um chat_id autorizado no .env.');
  } else if (telegramConfig.mode === 'polling') {
    const apiClient = new TelegramApiClient(telegramConfig.botToken);
    pollingService = new TelegramPollingService(
      apiClient,
      handleTelegramUpdateUseCase,
      telegramConfig.pollingIntervalMs
    );
    pollingService.start();
    console.log('[TelegramBot] Serviço iniciado em modo polling.');
  } else {
    console.log('[TelegramBot] Serviço configurado em modo webhook (/api/telegram/webhook).');
  }
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const shutdown = () => {
  if (pollingService) {
    pollingService.stop();
  }
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
