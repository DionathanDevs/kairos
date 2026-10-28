# Documentação de Funcionalidades — Kairos

Bem-vindo ao catálogo de funcionalidades atuais do **Kairos**. Cada documento descreve as regras de negócio, fluxos de interface, casos de uso do backend e contratos de API.

---

## Índice de Módulos

1. [**Rastreamento de Hábitos Diários (`habits-tracking.md`)**](./habits-tracking.md)
   - CRUD de hábitos com validação de domínio, matriz semanal expansível (Modo Foco **Hoje** vs **7 Dias**), marcação otimista, *Marcar Tudo Hoje* e *Resetar Semana*.
2. [**Métricas, Sequência Perfeita e Mapa de Consistência (`analytics-and-streaks.md`)**](./analytics-and-streaks.md)
   - Cálculo de *Perfect Streak*, percentual de consistência semanal, gráfico diário de barras (`WeeklyChart`) e mapa de calor anual estilo GitHub (`ConsistencyHeatmap`).
3. [**Gerenciamento de Tarefas por Prioridade e Contexto (`tasks-management.md`)**](./tasks-management.md)
   - Organização em abas **Pessoais** e **Trabalho**, tags de prioridade (`Alta`, `Média`, `Baixa`), ordenação inteligente, paginação progressiva e ações em lote.
4. [**Integração com Telegram Task Bot (`telegram-bot.md`)**](./telegram-bot.md)
   - Criação e listagem de tarefas via Telegram (modos *Polling* e *Webhook*), parser de linguagem natural com tags (`#work`, `#pessoal`, `!alta`, `!baixa`, `| descrição`) e controle de acesso *Zero-Trust*.
5. [**Experiência Mobile-First (PWA) e Internacionalização (`pwa-and-i18n.md`)**](./pwa-and-i18n.md)
   - Suporte nativo iOS/Android, *Safe Areas*, navegação adaptativa topo/base e alternância instantânea Português (`pt`) / Inglês (`en`).

---

## Catálogo Resumido da API REST

### Hábitos (`/api/habits`)

| Método | Rota | Caso de Uso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/habits` | `GetHabitsWithWeekUseCase` | Lista todos os hábitos e os status dos 7 dias da semana corrente (`Seg` a `Dom`). |
| `GET` | `/api/habits/stats` | `GetDashboardStatsUseCase` | Retorna `perfectStreakDays`, `weeklyConsistencyPct`, contadores de hoje e `weekDailySummary`. |
| `GET` | `/api/habits/heatmap?weeks=22` | `GetHeatmapUseCase` | Retorna matriz de semanas com níveis `0..4`, `totalActiveDays` e `completionRatePct`. |
| `POST` | `/api/habits` | `CreateHabitUseCase` | Cria um novo hábito (`title`, `description`, `color`). |
| `PUT` | `/api/habits/:id` | `UpdateHabitUseCase` | Atualiza título, descrição e cor de um hábito existente. |
| `DELETE` | `/api/habits/:id` | `DeleteHabitUseCase` | Remove um hábito e todo seu histórico (`ON DELETE CASCADE`). |
| `POST` | `/api/habits/:id/toggle` | `ToggleHabitLogUseCase` | Alterna a conclusão de um hábito em uma data (`{ date: "YYYY-MM-DD" }`). |
| `POST` | `/api/habits/actions/mark-all-today` | `MarkAllTodayUseCase` | Marca todos os hábitos cadastrados como concluídos na data de hoje. |
| `POST` | `/api/habits/actions/reset-week` | `ResetWeekUseCase` | Desmarca todos os registros compreendidos na semana atual (Segunda a Domingo). |

### Tarefas (`/api/tasks`)

| Método | Rota | Caso de Uso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | `GetTasksUseCase` | Lista tarefas com suporte opcional a filtro `?category=personal\|work`, `limit` e `offset`. |
| `POST` | `/api/tasks` | `CreateTaskUseCase` | Cria uma nova tarefa (`title`, `description`, `priority`, `category`). |
| `PUT` | `/api/tasks/:id` | `UpdateTaskUseCase` | Atualiza dados de uma tarefa existente. |
| `PATCH` | `/api/tasks/:id/toggle` | `ToggleTaskUseCase` | Alterna o estado `completed` (`true`/`false`) da tarefa. |
| `DELETE` | `/api/tasks/:id` | `DeleteTaskUseCase` | Exclui permanentemente uma tarefa. |
| `POST` | `/api/tasks/actions/complete-all` | `CompleteAllTasksUseCase` | Conclui todas as tarefas pendentes da categoria informada (`{ category }`). |
| `POST` | `/api/tasks/actions/clear-completed` | `ClearCompletedTasksUseCase` | Remove todas as tarefas já concluídas da categoria informada (`{ category }`). |

### Telegram & Saúde (`/api/telegram`, `/api/health`)

| Método | Rota | Componente | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/telegram/webhook` | `TelegramWebhookController` | Recebe updates do Telegram validados por `x-telegram-bot-api-secret-token`. |
| `GET` | `/api/health` | `app.ts` | Healthcheck da aplicação (`{ status: "ok", time: "<ISO>" }`). |
