export type TelegramBotMode = 'polling' | 'webhook';

export interface TelegramBotConfig {
  enabled: boolean;
  botToken: string;
  allowedChatIds: ReadonlySet<string>;
  mode: TelegramBotMode;
  pollingIntervalMs: number;
  webhookSecret: string;
}

export function loadTelegramBotConfig(
  env: Record<string, string | undefined> = process.env
): TelegramBotConfig {
  const enabled = String(env.TELEGRAM_BOT_ENABLED || 'false').trim().toLowerCase() === 'true';
  const botToken = (env.TELEGRAM_BOT_TOKEN || '').trim();

  const rawAllowedIds = (env.TELEGRAM_ALLOWED_CHAT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const allowedChatIds = new Set<string>(rawAllowedIds);

  const rawMode = (env.TELEGRAM_BOT_MODE || 'polling').trim().toLowerCase();
  const mode: TelegramBotMode = rawMode === 'webhook' ? 'webhook' : 'polling';

  const parsedInterval = parseInt(env.TELEGRAM_POLLING_INTERVAL_MS || '2000', 10);
  const pollingIntervalMs = Number.isFinite(parsedInterval) && parsedInterval >= 500 ? parsedInterval : 2000;

  const webhookSecret = (env.TELEGRAM_WEBHOOK_SECRET || '').trim();

  return {
    enabled,
    botToken,
    allowedChatIds,
    mode,
    pollingIntervalMs,
    webhookSecret
  };
}

export function sanitizeSensitiveText(text: string, secrets: string[] = []): string {
  if (!text) return '';
  let sanitized = text.replace(/\b[0-9]{8,10}:[a-zA-Z0-9_-]{35}\b/g, '[REDACTED_TELEGRAM_TOKEN]');
  for (const secret of secrets) {
    if (secret && secret.length >= 4) {
      sanitized = sanitized.split(secret).join('[REDACTED_SECRET]');
    }
  }
  return sanitized;
}
