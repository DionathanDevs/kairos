# Funcionalidade: Módulo de Tarefas para Agente IA (`AgentTask`)

## 1. Visão Geral
O módulo de **Tarefas para Agente IA** transforma o **Kairos** em uma central de comando e fila de orquestração para agentes autônomos externos. O usuário cadastra tarefas técnicas referenciando o repositório alvo, a intenção da tarefa (*prompt/objetivo*) e os critérios de aceite, enquanto um processo/agente externo consome a API REST para buscar trabalho, reportar progresso/impedimentos e entregar o Pull Request ou artefato final.

---

## 2. Os 4 Fluxos do Ciclo de Vida Autônomo

### 2.1. Marcar uma Tarefa como Elegível para Automação (`planning` $\rightarrow$ `ready`)
- **Rota**: `PATCH /api/agent-tasks/:id/ready` (ou criação direta com `"status": "ready"` em `POST /api/agent-tasks`).
- **Comportamento**: Valida que a tarefa possui `intent` e `repository_url` preenchidos, altera seu estado para `ready` e registra uma entrada no histórico (`ai_task_logs`) sinalizando que está disponível na fila de automação.

### 2.2. Buscar a Próxima Tarefa Pendente na Fila (`ready` $\rightarrow$ `in_progress`)
- **Rota**: `POST /api/agent-tasks/queue/next`
- **Payload Opcional**: `{ "agent_name": "autonomous-worker-01" }`
- **Comportamento**:
  - Executa uma transação SQLite `BEGIN IMMEDIATE` que seleciona a próxima tarefa `ready` respeitando a **prioridade** (`high` $\rightarrow$ `medium` $\rightarrow$ `low`) e a **ordem de chegada** (`order_index ASC, created_at ASC`).
  - Atualiza atomicamente o estado para `in_progress`, define `started_at` e `agent_name`, evitando que dois agentes concorrentes peguem a mesma tarefa.
  - Retorna todas as instruções estruturadas (`intent`, `description`, `acceptance_criteria`, `repository_url`, `target_branch`). Caso a fila esteja vazia, retorna `{ "task": null }`.

### 2.3. Registrar o Progresso ou Impedimento da Tarefa (`logs` / `blocked`)
- **Rota**: `POST /api/agent-tasks/:id/logs`
- **Payload**:
  ```json
  {
    "level": "progress",
    "message": "Repositório clonado e testes unitários executados.",
    "metadata": "branch: feat/jwt-auth",
    "mark_blocked": false
  }
  ```
- **Comportamento**:
  - Anexa o evento na tabela `ai_task_logs` (`level`: `'info' | 'progress' | 'error' | 'impediment' | 'artifact'`).
  - Se `level === "impediment"` ou `mark_blocked === true`, a tarefa muda automaticamente para o estado `blocked` (`Impedimento`), destacando o alerta em vermelho na interface do usuário.

### 2.4. Concluir a Tarefa com o Artefato Gerado (`in_review` / `completed`)
- **Rota**: `POST /api/agent-tasks/:id/complete`
- **Payload**:
  ```json
  {
    "artifact_url": "https://github.com/org/minha-aplicacao/pull/42",
    "summary": "Implementado endpoint e suíte de testes de integração.",
    "status": "in_review"
  }
  ```
- **Comportamento**:
  - Valida a presença de `artifact_url`, registra `completed_at`, anexa um log de nível `artifact` e move a tarefa para `in_review` (Em Revisão Humana, padrão) ou `completed`.

---

## 3. Segurança e Autenticação do Agente Externo (`AGENT_API_KEY`)

- As rotas de execução do agente externo (`POST /api/agent-tasks/queue/next`, `POST /api/agent-tasks/:id/logs`, `POST /api/agent-tasks/:id/complete`) suportam autenticação via token:
  - Header `x-agent-api-key: <AGENT_API_KEY>` ou `Authorization: Bearer <AGENT_API_KEY>`.
- Se a variável de ambiente `AGENT_API_KEY` estiver configurada no servidor, a chave é verificada com comparação em tempo constante (`crypto.timingSafeEqual`), retornando HTTP `401` em caso de ausência ou divergência. Se `AGENT_API_KEY` estiver vazia, permite consumo livre em ambiente local.

---

## 4. Arquitetura e Arquivos Relacionados

- **Domain**:
  - [`server/src/domain/entities/AgentTask.ts`](../../server/src/domain/entities/AgentTask.ts)
  - [`server/src/domain/entities/AgentTaskLog.ts`](../../server/src/domain/entities/AgentTaskLog.ts)
  - [`server/src/domain/repositories/IAgentTaskRepository.ts`](../../server/src/domain/repositories/IAgentTaskRepository.ts)
- **Application**:
  - [`server/src/application/usecases/AgentTaskUseCases.ts`](../../server/src/application/usecases/AgentTaskUseCases.ts)
- **Infrastructure & Presentation**:
  - [`server/migrations/004_create_ai_tasks_tables.sql`](../../server/migrations/004_create_ai_tasks_tables.sql)
  - [`server/src/infrastructure/database/repositories/SQLiteAgentTaskRepository.ts`](../../server/src/infrastructure/database/repositories/SQLiteAgentTaskRepository.ts)
  - [`server/src/presentation/controllers/AgentTaskController.ts`](../../server/src/presentation/controllers/AgentTaskController.ts)
  - [`server/src/presentation/routes/agentTaskRoutes.ts`](../../server/src/presentation/routes/agentTaskRoutes.ts)
- **Frontend**:
  - [`client/src/components/AgentTaskList.tsx`](../../client/src/components/AgentTaskList.tsx)
  - [`client/src/components/AgentTaskModal.tsx`](../../client/src/components/AgentTaskModal.tsx)
