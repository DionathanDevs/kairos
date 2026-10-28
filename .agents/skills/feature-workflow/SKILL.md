---
name: feature-workflow
description: >-
  Use this skill when implementing a new feature, modifying an existing feature, or fixing a bug
  in Kairos. Guides the end-to-end AI workflow from specification and domain modeling to UI
  implementation, quality gates execution, and feature documentation update.
---

# Kairos End-to-End AI Feature Workflow

Esta skill padroniza o fluxo de trabalho de ponta a ponta para criar ou evoluir funcionalidades no **Kairos** com alta confiabilidade.

## Fluxo de Execução em 6 Etapas

### Etapa 1: Contexto e Alinhamento
1. Consulte [ARCHITECTURE.md](../../../ARCHITECTURE.md) para identificar as camadas afetadas.
2. Consulte [DESIGN.md](../../../DESIGN.md) caso a tarefa envolva componentes visuais no `client/`.
3. Leia a documentação da funcionalidade relacionada em [`docs/features/`](../../../docs/features/README.md).

### Etapa 2: Camada de Domínio e Casos de Uso (`server/src/domain` & `application`)
1. Adicione ou atualize entidades (`domain/entities/`), serviços puros (`domain/services/`) e contratos de repositório (`domain/repositories/`).
2. Crie/atualize testes unitários de domínio em `server/test/unit/domain/` (obrigatório para passar no `gate:review`).
3. Implemente ou ajuste os Casos de Uso em `server/src/application/usecases/` e seus testes em `server/test/unit/usecases/`.

### Etapa 3: Infraestrutura e Apresentação (`server/src/infrastructure` & `presentation`)
1. Se houver mudança no esquema de dados, adicione uma nova migration sequencial idempotente em `server/migrations/NNN_descricao.sql` usando `CREATE TABLE IF NOT EXISTS`.
2. Atualize os repositórios SQLite em `server/src/infrastructure/database/repositories/`.
3. Exponha o endpoint no Controller (`presentation/controllers/`) e Router (`presentation/routes/`), e conecte as dependências em [`server/src/app.ts`](../../../server/src/app.ts).
4. Adicione testes de integração da API em `server/test/integration/` utilizando banco em memória (`new DatabaseSync(':memory:')`).

### Etapa 4: Frontend, Design System e i18n (`client/src/`)
1. Adicione os tipos necessários em [`client/src/types.ts`](../../../client/src/types.ts) e o método HTTP em [`client/src/api/client.ts`](../../../client/src/api/client.ts).
2. Registre todas as novas chaves de texto simultaneamente em `pt` e `en` em [`client/src/i18n/translations.ts`](../../../client/src/i18n/translations.ts).
3. Construa ou atualize os componentes em `client/src/components/` respeitando os tokens de cor e comportamento responsivo/PWA do [DESIGN.md](../../../DESIGN.md).
4. Adicione ou atualize os testes de componente (`*.test.tsx`) com Vitest e Testing Library.

### Etapa 5: Execução dos Gates de Qualidade e Code Review IA
Execute a pipeline unificada do projeto:

```powershell
npm test
```

> O comando `npm test` (equivalente a `npm run gate:all`) executa em sequência:
> 1. `gate:arch` (Arquitetura e dependências)
> 2. `gate:lint` (TypeScript, código limpo, tokens de Design e paridade i18n)
> 3. `gate:review` (Paridade de testes de domínio, migrations e controllers)
> 4. Testes Backend (`Jest`)
> 5. Testes Frontend (`Vitest`)

### Etapa 6: Atualização da Documentação
Atualize o arquivo correspondente em `docs/features/` (e `README.md` / `ARCHITECTURE.md` se aplicável) refletindo o novo comportamento ou endpoint.
