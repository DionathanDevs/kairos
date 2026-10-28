---
name: architecture-gate
description: >-
  Use this skill when designing new modules, refactoring layers, adding endpoints or components,
  or running architectural reviews in the Kairos project. Validates Clean Architecture boundaries,
  dependency directions, ESM conventions, and frontend API isolation.
---

# Kairos Architecture Gate & Clean Architecture Guide

Esta skill orienta a tomada de decisão arquitetural e a validação automatizada de fronteiras no projeto **Kairos**.

## 1. Documentos de Referência
Antes de criar novos arquivos ou mover responsabilidades entre camadas, consulte:
- [ARCHITECTURE.md](../../../ARCHITECTURE.md) — Especificação das camadas Clean Architecture (`domain`, `application`, `infrastructure`, `presentation`) e arquitetura React.
- [DESIGN.md](../../../DESIGN.md) — Tokens de UI, componentes e padrões de interação Mobile-First/PWA.

## 2. Matriz de Responsabilidades por Camada

| Camada | Diretório | O que deve conter | O que NUNCA deve conter |
| :--- | :--- | :--- | :--- |
| **Domain** | `server/src/domain/` | Entidades com invariantes (`Habit`, `Task`), Serviços puros (`StreakCalculator`), Contratos de Repositório (`I*Repository`), Erros (`DomainError`). | Queries SQL, `express`, `fetch`, `process.env`, dependências de `application` ou `infrastructure`. |
| **Application** | `server/src/application/` | Casos de Uso (`*UseCase.ts`), DTOs (`HabitDTOs.ts`), Parsers de entrada (`TelegramMessageParser.ts`). | Acesso direto ao SQLite (`DatabaseSync`), objetos `Request`/`Response` do Express, clientes HTTP concretos. |
| **Infrastructure** | `server/src/infrastructure/` | `SQLite*Repository`, `MigrationRunner`, `DatabaseConnection`, `TelegramApiClient`, `TelegramPollingService`. | Lógica de negócio de domínio ou rotas Express (`presentation`). |
| **Presentation** | `server/src/presentation/` | Controllers HTTP (`*Controller.ts`) e Rotas (`*Routes.ts`). | SQL direto, instanciação direta de `SQLite*Repository` (use injeção via `server/src/app.ts`). |
| **Client API** | `client/src/api/` | Funções de comunicação HTTP tipadas (`client.ts`). | Componentes React ou manipulação de estado de UI. |
| **Client UI** | `client/src/components/` | Componentes visuais React, modais, gráficos e listas. | Chamadas `fetch()` diretas ou regras de negócio de banco de dados. |

## 3. Como Executar o Gate de Arquitetura

Sempre após criar ou modificar imports entre arquivos, execute:

```powershell
npm run gate:arch
```

O script [arch-gate.mjs](../../../scripts/gates/arch-gate.mjs) verifica automaticamente:
1. **`ARCH-CLEAN-*`**: Nenhuma camada interna importa camadas externas.
2. **`ARCH-DOMAIN-PURITY` / `ARCH-APP-PURITY`**: Ausência de pacotes de I/O ou HTTP no núcleo.
3. **`ARCH-ESM-001`**: Todos os imports relativos em `server/src/` terminam com extensão `.js`.
4. **`ARCH-CLIENT-API`**: Nenhum componente em `client/src/components/` invoca `fetch()` diretamente.
5. **`ARCH-CYCLE-001`**: Inexistência de dependências circulares em `server/src` e `client/src`.

## 4. Resolução de Violações Comuns

- **Erro `ARCH-CLEAN-PRES`**: Você importou uma classe concreta de `infrastructure/` dentro de um controller. Extraia uma interface (ou use `import type`) e injete a instância concreta em [`server/src/app.ts`](../../../server/src/app.ts).
- **Erro `ARCH-ESM-001`**: Adicione `.js` ao final do caminho relativo no import TypeScript (ex.: `import { Habit } from '../entities/Habit.js'`).
- **Erro `ARCH-CLIENT-API`**: Mova a chamada `fetch('/api/...')` do componente React para um método em [`client/src/api/client.ts`](../../../client/src/api/client.ts).
