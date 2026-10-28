# Funcionalidade: Experiência Mobile-First (PWA) e Internacionalização (i18n)

## 1. Progressive Web App (PWA) e Sensação Nativa

O Kairos é configurado para instalação na tela de início em dispositivos iOS e Android, comportando-se como um aplicativo nativo:

### 1.1. Manifesto e Meta Tags (`client/public/manifest.json` & `client/index.html`)
- `display: "standalone"` com fundo e `theme-color` em `#0c0e12`.
- Ícones dedicados (`192x192`, `512x512` e `apple-touch-icon`).
- Configuração `viewport-fit=cover` e `apple-mobile-web-app-status-bar-style="black-translucent"`.

### 1.2. Otimizações CSS para Toque (`client/src/index.css`)
- **Prevenção de Pull-to-Refresh acidental**: `overscroll-behavior: none`.
- **Bloqueio de seleção acidental na UI**: `user-select: none` global, mantendo `user-select: text` habilitado apenas em `input`, `textarea` e `[contenteditable="true"]`.
- **Eliminação de atraso de toque (300ms)**: `touch-action: manipulation` e `-webkit-tap-highlight-color: transparent`.
- **Safe Area Insets**: Classes `.safe-area-container`, `.safe-top` e `.safe-bottom` utilizando `env(safe-area-inset-*)` para evitar sobreposição com o *notch* ou barra inferior do sistema operacional.

---

## 2. Internacionalização Bilingue (`pt` / `en`)

Implementada em [`client/src/i18n/translations.ts`](../../client/src/i18n/translations.ts):
1. **Idiomas Suportados**: Português (`pt`, idioma padrão) e Inglês (`en`).
2. **Persistência**: A escolha do usuário é salva automaticamente em `localStorage` sob a chave `habit_tracker_lang`.
3. **Alternância Instantânea**: O botão com ícone de globo (`Globe`) no cabeçalho (`Header.tsx`) alterna entre `PT` e `EN` sem necessidade de recarregar a página, traduzindo:
   - Títulos, subtítulos e botões de ação;
   - Abreviações dos dias da semana (`Seg..Dom` $\leftrightarrow$ `Mon..Sun`) e meses (`Jan..Dez` $\leftrightarrow$ `Jan..Dec`);
   - Modais de criação/edição, placeholders e mensagens de erro/confirmação;
   - Notificações *Toast*.
4. **Garantia de Paridade via Linter**: O script [`scripts/gates/lint-gate.mjs`](../../scripts/gates/lint-gate.mjs) verifica em todos os testes se todas as chaves do objeto `pt` existem em `en` e vice-versa (`LINT-I18N-PARITY`).
