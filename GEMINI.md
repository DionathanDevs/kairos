# Kairos — Regras do Workspace e Diretrizes de Engenharia para IA

Este repositório contém o **Kairos**, uma aplicação Web / PWA para rastreamento de hábitos diários, métricas de consistência anual e gerenciamento de tarefas pessoais e de trabalho (com suporte a bot do Telegram).

Sempre siga estas regras ao planejar, escrever código, criar testes ou revisar alterações neste projeto.

---

## 1. Arquitetura e Fronteiras de Camadas (`ARCHITECTURE.md`)

O backend (`server/src/`) segue **Clean Architecture** estrita com módulos ES (`NodeNext` — todos os imports relativos em `server/src/` **devem** terminar com `.js`):

1. **`server/src/domain/` (Núcleo Puro)**:
   - Contém Entidades (`Habit`, `HabitLog`, `Task`), Serviços de Domínio (`StreakCalculator`, `ConsistencyCalculator`, `HeatmapCalculator`, `DateRangeService`), Interfaces de Repositório (`IHabitRepository`, `IHabitLogRepository`, `ITaskRepository`) e Erros (`DomainError`, `ValidationError`, `NotFoundError`).
   - **PROIBIDO** importar de `application/`, `infrastructure/`, `presentation/` ou pacotes de infraestrutura/HTTP (`express`, `cors`, `node:sqlite`, `node:fs`).
2. **`server/src/application/` (Casos de Uso e Serviços de Aplicação)**:
   - Contém Use Cases, DTOs e parsers de aplicação (`TelegramMessageParser`).
   - Depende exclusivamente de `domain/` e `application/`. **PROIBIDO** importar `infrastructure/`, `presentation/`, `express` ou `node:sqlite`.
3. **`server/src/infrastructure/` (Adaptadores Externos e Persistência)**:
   - Contém `DatabaseConnection` (`node:sqlite` `DatabaseSync`), `MigrationRunner`, repositórios concretos (`SQLite*Repository`) e clientes externos (`TelegramApiClient`, `TelegramPollingService`).
   - Nunca deve depender de `presentation/`.
4. **`server/src/presentation/` (Entrega HTTP / Express)**:
   - Contém `controllers/` e `routes/`.
   - **PROIBIDO** instanciar ou importar implementações concretas de `infrastructure/` em tempo de execução. Toda injeção de dependência acontece na *Composition Root* (`server/src/app.ts`).
   - Controllers REST devem traduzir `ValidationError` → `400`, `NotFoundError` → `404` e `DomainError` → `422`.
5. **`client/src/` (Frontend React 19 + Vite + Tailwind CSS)**:
   - Componentes em `client/src/components/` **NUNCA** devem chamar `fetch()` diretamente; toda comunicação com o backend deve passar por `client/src/api/client.ts`.
   - Toda string visível ao usuário deve estar registrada em `client/src/i18n/translations.ts` com paridade obrigatória entre `pt` e `en`.

---

## 2. Design System e Experiência de Usuário (`DESIGN.md`)

1. **Tema Dark Emerald**:
   - Use sempre os tokens configurados no Tailwind (`bg-dark-bg`, `bg-dark-card`, `bg-dark-cardHover`, `border-dark-border`, `border-dark-subtle`, `bg-brand-green`, `text-brand-green`, `bg-brand-greenLight`, `text-brand-cyan`).
   - Não introduza cores hexadecimais arbitrárias fora da paleta documentada em `DESIGN.md`.
2. **Sensação de App Nativo (PWA Mobile-First)**:
   - Preserve os espaçamentos de *Safe Area* (`safe-area-container`, `safe-top`, `safe-bottom`).
   - Nunca utilize `window.alert()` ou `window.confirm()`; utilize sempre o componente `ConfirmModal` ou notificações *Toast*.
   - Ações de toggle frequentes (marcar hábito ou tarefa) devem usar atualização otimista (*Optimistic UI*) com rollback em caso de erro de rede.

---

## 3. Quality Gates, Linters e Testes Obrigatórios

Antes de considerar qualquer alteração de código concluída, a IA **DEVE** executar os gates do projeto:

- `npm run gate:arch` — Verifica fronteiras da Clean Architecture, isolamento da camada de API no cliente, ausência de dependências circulares e extensões `.js` ESM.
- `npm run gate:lint` (ou `npm run lint`) — Executa `tsc --noEmit` no `server` e `client`, proíbe `console.log`/`debugger`/`alert`/`@ts-ignore`/`any` nas camadas centrais, valida tokens de cor do `DESIGN.md` e verifica 100% de paridade `pt`/`en` em `translations.ts`.
- `npm run gate:review` — Verifica paridade de testes unitários no domínio, sequência e idempotência de migrations SQL, mapeamento de erros nos controllers e limites de tamanho de arquivo.
- `npm test` (ou `npm run gate:all`) — Executa todos os 3 gates acima + suíte completa de testes backend (`Jest`) e frontend (`Vitest`).

---

## 4. Manutenção de Documentação Viva

- Ao criar ou alterar funcionalidades, rotas da API ou regras de negócio, atualize a documentação correspondente em `docs/features/`.
- Ao alterar camadas arquiteturais ou tokens visuais, mantenha `ARCHITECTURE.md` e `DESIGN.md` sincronizados.
