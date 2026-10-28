---
name: ai-code-review
description: >-
  Use this skill during testing, before completing any coding task, or when the user requests a
  code review. Runs automated linters, static analysis, and architecture gates, and applies a
  structured review checklist for domain invariants, security, Design System, and test coverage.
---

# Kairos AI Code Review & Quality Gate Workflow

Esta skill define o procedimento padrão de **Code Review da própria IA** que deve ser executado durante a fase de testes ou quando o usuário solicitar uma revisão de código/arquitetura.

## Passo 1: Executar os Gates Automatizados

Execute os três verificadores estáticos e a suíte de testes:

```powershell
# 1. Gate de Arquitetura (Clean Architecture, Ciclos, ESM, API Client)
npm run gate:arch

# 2. Gate de Linters (TSC Strict, Proibição de console.log/debugger/any, Tokens DESIGN.md, Paridade i18n)
npm run gate:lint

# 3. Gate de Code Review (Paridade de testes no domínio, Migrations SQL, Error Mapping nos Controllers)
npm run gate:review

# Ou rode a pipeline completa com Jest + Vitest:
npm run gate:all
```

Se qualquer um dos gates falhar (`exit code != 0`), corrija imediatamente os problemas apontados antes de prosseguir.

## Passo 2: Inspeção Semântica das Alterações (`git status` / `git diff`)

Além dos scripts automatizados, revise o diff das alterações verificando os seguintes critérios:

### A. Domínio e Backend (`server/`)
1. **Invariantes nas Entidades**: Validações de tamanho, obrigatoriedade e formato lançam `ValidationError` dentro da entidade de domínio (`Habit`, `Task`, `HabitLog`), nunca apenas no controller.
2. **Segurança SQL e Parâmetros**: Todas as queries em `SQLite*Repository` utilizam *prepared statements* (`db.prepare(...)`) com parâmetros `?`. Nunca concatene strings do usuário em SQL.
3. **Segurança de Segredos/Tokens**: Nenhum token (como `TELEGRAM_BOT_TOKEN` ou `TELEGRAM_WEBHOOK_SECRET`) é registrado em logs sem passar por `sanitizeSensitiveText()`.
4. **Mapeamento HTTP**: Controllers REST retornam `400` para `ValidationError`, `404` para `NotFoundError` e `422` para `DomainError`.

### B. Frontend, UI/UX e Design System (`client/`)
1. **Aderência ao [DESIGN.md](../../../DESIGN.md)**:
   - Uso consistente de `bg-dark-card`, `border-dark-border`, `text-brand-green` e `rounded-2xl`.
   - Botões de ação possuem feedback tátil (`active:scale-95` ou `active:scale-90`) e estados `disabled:opacity-50`.
2. **Optimistic UI & Rollback**:
   - Ações de alternância rápida (`handleToggleDay`, `handleToggleTask`) atualizam o estado local imediatamente e revertem/recarregam os dados no bloco `catch`.
3. **Internacionalização (`pt` / `en`)**:
   - Textos de interface utilizam `translations[lang]` em vez de strings fixas em apenas um idioma.

### C. Cobertura de Testes e Documentação
1. Novos serviços de domínio ou casos de uso possuem testes unitários em `server/test/unit/`.
2. Novos endpoints possuem testes de integração com Supertest e SQLite `:memory:` em `server/test/integration/`.
3. Alterações em funcionalidades existentes foram refletidas em `docs/features/`.

## Passo 3: Formato de Relatório de Code Review (Quando solicitado pelo Usuário)

Ao reportar uma revisão ao usuário, estruture o resultado em:
- **Status dos Gates Automatizados**: Resultado de `gate:arch`, `gate:lint`, `gate:review` e testes (`Jest` / `Vitest`).
- **Pontos Críticos (Bloqueantes)**: Bugs, quebras de arquitetura ou falhas de segurança.
- **Avisos / Melhorias**: Oportunidades de simplificação, performance ou UX.
- **Conformidade com `ARCHITECTURE.md` e `DESIGN.md`**.
