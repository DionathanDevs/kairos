# Funcionalidade: Integração com Telegram Task Bot

## 1. Visão Geral
O Kairos possui integração nativa com a API de Bots do Telegram para permitir a captura rápida de tarefas e consulta de pendências diretamente pelo celular ou desktop via chat do Telegram, operando em modo **Long Polling** ou **Webhook**.

---

## 2. Segurança e Controle de Acesso (Zero-Trust)

Implementado em [`HandleTelegramUpdateUseCase.ts`](../../server/src/application/usecases/HandleTelegramUpdateUseCase.ts) e [`TelegramBotConfig.ts`](../../server/src/infrastructure/telegram/TelegramBotConfig.ts):
1. **Allowlist Obrigatória (`TELEGRAM_ALLOWED_CHAT_IDS`)**:
   - Se a lista de IDs permitidos estiver vazia, **nenhuma** mensagem é processada (`unauthorized`).
   - Apenas mensagens cujo `chat.id` ou `from.id` constem na allowlist são executadas.
2. **Autenticação de Webhook (`TELEGRAM_WEBHOOK_SECRET`)**:
   - No modo Webhook (`POST /api/telegram/webhook`), o cabeçalho `x-telegram-bot-api-secret-token` é verificado com comparação em tempo constante (`crypto.timingSafeEqual`).
3. **Sanitização de Segredos em Logs (`sanitizeSensitiveText`)**:
   - Qualquer erro de rede ou resposta da API do Telegram passa por redatora automática que mascara padrões de token (`[REDACTED_TELEGRAM_TOKEN]`) antes de ser lançado ou registrado em log.

---

## 3. Sintaxe de Mensagens e Comandos (`TelegramMessageParser.ts`)

O parser interpreta mensagens livres ou comandos explícitos:

### 3.1. Comandos Disponíveis
- `/ajuda`, `/help` ou `/start`: Exibe o guia rápido de uso e exemplos de tags.
- `/tarefas`, `/tasks` ou `/list` (opcionalmente seguido de `#work` ou `#pessoal`): Lista até 15 tarefas pendentes ordenadas com ícones de prioridade (`🔴`, `🟡`, `🟢`).
- `/tarefa <texto>`, `/add <texto>`, `/task <texto>` ou **envio direto de qualquer texto sem barra**: Cria uma nova tarefa.

### 3.2. Extração Inteligente de Tags e Descrição
Em qualquer texto de criação de tarefa, o parser detecta e remove automaticamente as tags do título:
- **Categoria**:
  - Trabalho: `#work`, `#trabalho`, `#trab`
  - Pessoal (padrão): `#personal`, `#pessoal`, `#casa`
- **Prioridade**:
  - Alta: `!alta`, `!high`, `!urgente`, `#alta`, `#high`, `!!`
  - Média (padrão): `!media`, `!média`, `!medium`, `#media`
  - Baixa: `!baixa`, `!low`, `#baixa`
- **Descrição**:
  - Pode ser informada na primeira linha após o caractere pipe (`|`) ou nas linhas seguintes da mensagem.
- **Títulos Longos (`> 100` caracteres)**:
  - Caso o título exceda 100 caracteres, o parser trunca o título com reticências (`97 chars + ...`) e preserva o texto integral automaticamente no campo `description`.

**Exemplo de mensagem no Telegram:**
```text
Revisar arquitetura do módulo de pagamentos #work !alta | Validar contratos com o time
```
$\rightarrow$ Cria tarefa **Revisar arquitetura do módulo de pagamentos**, Categoria: `work`, Prioridade: `high`, Descrição: `Validar contratos com o time`.

---

## 4. Variáveis de Ambiente de Configuração

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_ENABLED` | `false` | Define se o bot deve ser iniciado (`true` / `false`). |
| `TELEGRAM_BOT_TOKEN` | `""` | Token gerado pelo `@BotFather`. |
| `TELEGRAM_ALLOWED_CHAT_IDS` | `""` | Lista de `chat_id` ou `user_id` separados por vírgula (ex.: `12345678,98765432`). |
| `TELEGRAM_BOT_MODE` | `polling` | Modo de operação: `polling` (busca ativa) ou `webhook` (`POST /api/telegram/webhook`). |
| `TELEGRAM_POLLING_INTERVAL_MS` | `2000` | Intervalo entre ciclos de polling em milissegundos (mínimo `500`). |
| `TELEGRAM_WEBHOOK_SECRET` | `""` | Segredo validado no header `x-telegram-bot-api-secret-token` quando em modo `webhook`. |

---

## 5. Arquitetura e Arquivos Relacionados

- **Application**:
  - [`server/src/application/services/TelegramMessageParser.ts`](../../server/src/application/services/TelegramMessageParser.ts)
  - [`server/src/application/usecases/HandleTelegramUpdateUseCase.ts`](../../server/src/application/usecases/HandleTelegramUpdateUseCase.ts)
- **Infrastructure**:
  - [`server/src/infrastructure/telegram/TelegramBotConfig.ts`](../../server/src/infrastructure/telegram/TelegramBotConfig.ts)
  - [`server/src/infrastructure/telegram/TelegramApiClient.ts`](../../server/src/infrastructure/telegram/TelegramApiClient.ts)
  - [`server/src/infrastructure/telegram/TelegramPollingService.ts`](../../server/src/infrastructure/telegram/TelegramPollingService.ts)
- **Presentation**:
  - [`server/src/presentation/controllers/TelegramWebhookController.ts`](../../server/src/presentation/controllers/TelegramWebhookController.ts)
  - [`server/src/presentation/routes/telegramRoutes.ts`](../../server/src/presentation/routes/telegramRoutes.ts)
