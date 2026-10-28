# Kairos — Habit Tracker, Consistency Heatmap & Task Manager

O **Kairos** é uma aplicação Web e PWA (*Progressive Web App*) construída com **Clean Architecture** no backend (`Node.js` + `Express` + `node:sqlite`) e **React 19 + Tailwind CSS** no frontend. Projetado com a identidade visual **Dark Emerald**, o Kairos combina o rastreamento diário de hábitos, análise de consistência de longo prazo estilo GitHub e gerenciamento de tarefas pessoais e de trabalho com integração via **Telegram Bot**.

---

## ✨ Principais Funcionalidades

- **Rastreamento de Hábitos Diários**:
  - Matriz semanal interativa com alternância entre **Modo Foco (Apenas Hoje)** e **Modo Semana Completa (7 Dias)**.
  - Marcação instantânea com *Optimistic UI*, celebração com confetes ao atingir 100% no dia e ação de reset semanal seguro.
- **Analytics, Sequência Perfeita e Heatmap Anual**:
  - Cálculo de **Sequência Perfeita** (*Perfect Streak*), **Consistência Semanal (%)** e **Meta Diária**.
  - **Mapa de Consistência (`ConsistencyHeatmap`)** de 22+ semanas com 5 níveis de intensidade (`0..4`), contagem de dias ativos e taxa geral de conclusão.
  - **Gráfico Semanal de Barras (`WeeklyChart`)** diferenciando dias perfeitos (Verde Esmeralda) de dias parciais (Azul Ciano).
- **Gerenciamento de Tarefas Pessoais e de Trabalho**:
  - Separação por contexto (**Pessoais** | **Trabalho**) com contadores de pendências em tempo real.
  - Classificação por prioridade (**Alta**, **Média**, **Baixa**), ordenação inteligente automática, paginação incremental (*Mostrar mais*) e ações em lote.
- **Integração com Telegram Task Bot**:
  - Criação e listagem de tarefas pelo Telegram (via *Polling* ou *Webhook*) com parser de tags (`#work`, `#pessoal`, `!alta`, `!baixa`, `| descrição`) e segurança *Zero-Trust* por allowlist de `chat_id`.
- **PWA Mobile-First & Bilingue (`PT` / `EN`)**:
  - Instalável no iOS e Android com suporte a *Safe Areas*, barra de navegação adaptativa (fixa na base no mobile, topo no desktop) e alternância instantânea entre Português e Inglês.

---

## 📚 Documentação do Projeto

| Documento | Descrição |
| :--- | :--- |
| [**`ARCHITECTURE.md`**](./ARCHITECTURE.md) | Arquitetura detalhada do sistema, camadas da Clean Architecture, modelo de dados SQLite e diagramas Mermaid. |
| [**`DESIGN.md`**](./DESIGN.md) | Especificação do Design System *Dark Emerald*, paleta de tokens, tipografia, padrões responsivos e PWA. |
| [**`GEMINI.md`**](./GEMINI.md) | Regras de engenharia e restrições arquiteturais sempre ativas para desenvolvimento assistido por IA. |
| [**`docs/features/README.md`**](./docs/features/README.md) | Índice completo das funcionalidades atuais e catálogo de endpoints da API REST. |
| [Hábitos Diários](./docs/features/habits-tracking.md) | Regras de negócio, fluxos de interface e casos de uso do módulo de hábitos. |
| [Analytics & Heatmap](./docs/features/analytics-and-streaks.md) | Fórmulas de cálculo de sequência perfeita, consistência semanal e mapa de calor. |
| [Gestão de Tarefas](./docs/features/tasks-management.md) | Categorias, prioridades, ordenação automática e paginação de tarefas. |
| [Telegram Task Bot](./docs/features/telegram-bot.md) | Comandos, sintaxe de tags, configuração de variáveis de ambiente e segurança do bot. |
| [PWA & Internacionalização](./docs/features/pwa-and-i18n.md) | Comportamento nativo mobile e paridade de traduções `pt`/`en`. |

---

## 🛠️ Stack Tecnológica

- **Frontend (`client/`)**: React 19, TypeScript, Vite 8, Tailwind CSS 3, Lucide Icons, Canvas Confetti, Vitest + React Testing Library.
- **Backend (`server/`)**: Node.js (v22.5+ / v23+ com módulo nativo `node:sqlite`), Express 4, TypeScript (`NodeNext` ESM), Jest + Supertest.
- **Infraestrutura**: Docker Multi-Stage Build (`node:23-alpine`) e Docker Compose com volume persistente SQLite WAL.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** `>= 22.5.0` (recomendado Node 22 LTS ou 23+, pois utiliza o módulo nativo `node:sqlite`).
- **npm** `>= 10`.

### 1. Instalação das Dependências
Na raiz do repositório, instale as dependências da raiz, do `client` e do `server`:

```bash
npm run install:all
```

### 2. Ambiente de Desenvolvimento
Em dois terminais separados, inicie o servidor backend (porta `3001`) e o cliente Vite (porta `5173` com proxy para `/api`):

```bash
# Terminal 1 — Backend API (http://localhost:3001)
npm run dev:server

# Terminal 2 — Frontend Vite (http://localhost:5173)
npm run dev:client
```

### 3. Build e Execução em Produção Local

```bash
# Compila o frontend (client/dist) e o backend (server/dist)
npm run build

# Inicia o servidor Express servindo a API e os arquivos estáticos em http://localhost:3001
npm start
```

### 4. Execução via Docker Compose

```bash
docker compose up -d --build
```
A aplicação ficará disponível em `http://localhost:3001` com os dados SQLite persistidos no volume Docker `habit_tracker_data`.

---

## 🛡️ AI Quality Gates, Linters e Testes

O projeto conta com uma suíte de **Quality Gates automatizados** em [`scripts/gates/`](./scripts/gates/) projetada para validar arquitetura, linters e qualidade de código durante o fluxo de desenvolvimento e testes da IA:

```bash
# Executa toda a pipeline: Architecture Gate + Linter Gate + Code Review Gate + Jest + Vitest
npm test
# (ou npm run gate:all)
```

Você também pode executar cada gate ou suíte de testes individualmente:

| Comando | Descrição |
| :--- | :--- |
| `npm run gate:arch` | **Gate de Arquitetura**: Verifica fronteiras da Clean Architecture (`domain`, `application`, `infrastructure`, `presentation`), isolamento de `fetch` no cliente, ciclos de dependência e extensões `.js` ESM. |
| `npm run gate:lint` / `npm run lint` | **Gate de Linters**: Executa `tsc --noEmit` no `server` e `client`, bloqueia `console.log`/`debugger`/`alert`/`@ts-ignore`/`any` nas camadas centrais, valida tokens hex do `DESIGN.md` e paridade `pt`/`en` no `translations.ts`. |
| `npm run gate:review` | **Gate de Code Review IA**: Verifica paridade de testes unitários no domínio, sequência e idempotência de migrations SQL, tratamento de erros HTTP nos controllers e tamanho de arquivos. |
| `npm run test:server` | Executa todos os testes unitários e de integração do backend (`Jest`). |
| `npm run test:client` | Executa todos os testes de componentes do frontend (`Vitest`). |

---

## 🤖 Workflow Assistido por IA (Skills & Rules)

O repositório inclui customizações nativas em [`.agents/skills/`](./.agents/skills/) e [`GEMINI.md`](./GEMINI.md) para refinar o trabalho de agentes de IA:

- **`architecture-gate`** ([`.agents/skills/architecture-gate/SKILL.md`](./.agents/skills/architecture-gate/SKILL.md)): Guia de decisão de camadas Clean Architecture e validação de fronteiras.
- **`ai-code-review`** ([`.agents/skills/ai-code-review/SKILL.md`](./.agents/skills/ai-code-review/SKILL.md)): Procedimento estruturado de auto-revisão combinando os gates estáticos com checklist semântico de domínio, segurança e UI.
- **`feature-workflow`** ([`.agents/skills/feature-workflow/SKILL.md`](./.agents/skills/feature-workflow/SKILL.md)): Passo a passo de ponta a ponta (Domínio $\rightarrow$ Use Cases $\rightarrow$ Infra/API $\rightarrow$ Frontend/i18n $\rightarrow$ Quality Gates $\rightarrow$ Documentação).

---

## 📂 Estrutura de Diretórios

```text
kairos/
├── .agents/
│   └── skills/                  # Skills da IA (architecture-gate, ai-code-review, feature-workflow)
├── client/                      # Frontend React 19 + Vite + Tailwind CSS
│   ├── public/                  # Manifesto PWA e ícones
│   └── src/
│       ├── api/                 # Cliente HTTP centralizado (client.ts)
│       ├── components/          # Componentes visuais e testes Vitest (*.test.tsx)
│       ├── i18n/                # Dicionários de tradução (pt / en)
│       ├── App.tsx              # Orquestração de estado e Optimistic UI
│       └── index.css            # Estilos globais e utilitários nativos PWA
├── docs/
│   └── features/                # Documentação funcional e técnica de cada módulo
├── scripts/
│   └── gates/                   # Scripts executáveis de Arquitetura, Linters e Code Review
├── server/                      # Backend Node.js + Express + Clean Architecture
│   ├── migrations/              # Migrações SQLite sequenciais (001..003)
│   ├── src/
│   │   ├── domain/              # Entidades, Serviços de Domínio, Contratos e Erros
│   │   ├── application/         # Use Cases, DTOs e TelegramMessageParser
│   │   ├── infrastructure/      # SQLite (node:sqlite), MigrationRunner e Telegram Client/Polling
│   │   ├── presentation/        # Controllers e Rotas Express
│   │   └── app.ts               # Composition Root
│   └── test/                    # Testes Unitários (domain/usecases/services) e Integração (Supertest)
├── ARCHITECTURE.md              # Documentação de Arquitetura
├── DESIGN.md                    # Especificação do Design System
├── GEMINI.md                    # Regras do Workspace para IA
└── README.md                    # Guia Principal do Projeto
```
