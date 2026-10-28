# Design System & Diretrizes de UI/UX — Kairos (`DESIGN.md`)

O **Kairos** adota a identidade visual **Dark Emerald Native-Feel UI** — uma interface escura de alto contraste, minimalista e acolhedora, projetada para oferecer a fluidez e a ergonomia de um aplicativo nativo tanto em dispositivos móveis (PWA iOS/Android) quanto no desktop.

---

## 1. Princípios de Design

1. **Foco Diário sem Sobrecarga Cognitiva**: Por padrão, a matriz de hábitos exibe apenas a coluna **HOJE** para permitir marcação rápida com uma mão no celular, oferecendo expansão sob demanda para a semana completa de 7 dias.
2. **Feedback Instantâneo (Optimistic & Tactile UI)**: Cada clique responde imediatamente com micro-animações (`active:scale-90`, `animate-check-pop`) e celebrações visuais (`canvas-confetti` ao concluir todas as metas do dia).
3. **Ergonomia Mobile-First & PWA Nativo**: Suporte integral a *Safe Areas* (notch e barra de gestos), bloqueio de *overscroll* elástico e seleção acidental de texto, e navegação principal posicionada na zona do polegar no mobile.
4. **Bilinguismo Nativo (PT / EN)**: Todos os componentes adaptam rótulos, datas abreviadas e mensagens de confirmação instantaneamente entre Português e Inglês.

---

## 2. Paleta de Cores e Tokens

Todos os tokens principais estão configurados em [`client/tailwind.config.js`](./client/tailwind.config.js) e são auditados pelo linter [`scripts/gates/lint-gate.mjs`](./scripts/gates/lint-gate.mjs).

### 2.1. Superfícies Escuras (`dark.*`)

| Token Tailwind | Hex | Uso Principal |
| :--- | :--- | :--- |
| `bg-dark-bg` | `#0c0e12` | Fundo global da aplicação (`body`), inputs de formulário e tooltips flutuantes. |
| `bg-dark-card` | `#15181e` | Superfície principal dos cards (`HabitGrid`, `ConsistencyHeatmap`, `StatCards`, `WeeklyChart`, `TaskList`, Modais). |
| `bg-dark-cardHover` | `#1a1e26` | Estado de hover em linhas de hábitos/tarefas e botões secundários. |
| `border-dark-border` | `#232732` | Bordas estruturais de cards, divisórias e containers. |
| `border-dark-subtle` | `#2a303e` | Bordas destacadas em hover de cards e badges secundários. |
| Superfície de Check Inativo | `#181b22` | Fundo dos botões circulares não marcados e células nível `0` do Heatmap (com borda `#262c38` / `#232732`). |

### 2.2. Cores de Marca e Acento (`brand.*`)

| Token Tailwind | Hex | Uso Principal |
| :--- | :--- | :--- |
| `brand-green` | `#10b981` | Cor primária de ação (botões principais, checks concluídos, ícones ativos, barras de dias 100% perfeitos). |
| `brand-greenLight` | `#34d399` | Estado de hover do botão primário e nível máximo (`4`) do Heatmap. |
| `brand-greenDark` | `#047857` | Nível intermediário (`2`) do Heatmap e acentos profundos. |
| `brand-cyan` | `#7dd3fc` | Destaque para a métrica de taxa geral no Heatmap e partículas de confete. |
| `brand-cyanLight` | `#93c5fd` | Barras do `WeeklyChart` em dias com conclusão parcial ($< 100\%$). |

### 2.3. Escala do Mapa de Consistência (`ConsistencyHeatmap`)

| Nível | Critério de Conclusão | Cor Hex | Classe / Estilo |
| :---: | :--- | :--- | :--- |
| **0** | $0\%$ (Nenhum hábito concluído) | `#181b22` | `bg-[#181b22] border border-[#232732]` |
| **1** | $1\% \text{ a } 25\%$ | `#064e3b` | `bg-[#064e3b]` |
| **2** | $26\% \text{ a } 50\%$ | `#047857` | `bg-[#047857]` |
| **3** | $51\% \text{ a } 75\%$ | `#10b981` | `bg-[#10b981]` |
| **4** | $76\% \text{ a } 100\%$ | `#34d399` | `bg-[#34d399]` |

### 2.4. Cores Semânticas de Prioridade de Tarefas (`TaskList` & `TaskModal`)

- **Alta (`high`)**: `bg-red-500/15 text-red-400 border-red-500/30`
- **Média (`medium`)**: `bg-amber-500/15 text-amber-400 border-amber-500/30`
- **Baixa (`low`)**: `bg-sky-500/15 text-sky-400 border-sky-500/30`

### 2.5. Paleta de Cores de Hábitos (`HabitModal`)

Opções selecionáveis pelo usuário ao criar/editar um hábito:
- Emerald (`#10b981`), Ocean Blue (`#0ea5e9`), Violet (`#8b5cf6`), Amber (`#f59e0b`), Pink (`#ec4899`) e Cyan (`#06b6d4`).

---

## 3. Tipografia e Hierarquia

- **Fonte Principal (`font-sans`)**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
- **Fonte Monoespaçada**: `JetBrains Mono` (disponível para contadores técnicos).
- **Padrões de Escala**:
  - **Título da Aplicação (`Header`)**: `text-2xl sm:text-3xl font-bold tracking-tight text-white`.
  - **Cabeçalhos de Seção / Cards**: `text-xs font-semibold text-gray-400 tracking-wider uppercase`.
  - **Valores de Métricas (`StatCards`)**: `text-2xl sm:text-3xl font-extrabold text-white tracking-tight`.
  - **Títulos de Hábitos e Tarefas**: `font-semibold text-sm sm:text-base text-gray-100`.
  - **Descrições / Metas Diárias**: `text-xs text-gray-400 font-normal truncate`.

---

## 4. Layout, Navegação e Comportamento PWA

### 4.1. Container Principal e Safe Areas
Definido em [`client/src/index.css`](./client/src/index.css):
- Largura máxima centralizada: `max-w-4xl mx-auto`.
- `.safe-area-container`: Respeita `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)` e `env(safe-area-inset-right)`.
- Espaçamento inferior extra no mobile (`pb-28 md:pb-10`) para evitar que a barra de navegação flutuante cubra o último card.

### 4.2. Barra de Navegação em Pílula (`NavigationMenu.tsx`)
- **Mobile (`< md`)**: Fixa na parte inferior (`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40`), com `backdrop-blur-md` e sombra elevada.
- **Desktop (`>= md`)**: Estática e centralizada no topo da página (`md:static md:mb-5`).
- **Botão Central Contextual (`+`)**: Botão circular `bg-brand-green text-black` entre as abas **Hábitos** e **Tarefas**. Abre o `HabitModal` quando na aba Hábitos, ou o `TaskModal` quando na aba Tarefas.

### 4.3. Modais Responsivos (Bottom Sheet no Mobile / Dialog no Desktop)
- `HabitModal` e `TaskModal` alinham-se na base da tela em celulares (`items-end sm:items-center`, `rounded-t-3xl sm:rounded-2xl`) com indicador visual de arraste (`w-12 h-1.5 bg-dark-border rounded-full`), comportando-se como *Bottom Sheets* nativos.
- Ações destrutivas (excluir hábito, excluir tarefa, resetar semana, limpar tarefas concluídas) **nunca** usam `window.confirm()`; utilizam obrigatoriamente o componente [`ConfirmModal.tsx`](./client/src/components/ConfirmModal.tsx) com suporte à tecla `Escape`.

---

## 5. Micro-interações e Animações

- **Check Pop (`animate-check-pop`)**: Keyframe `checkGlow` (`0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)`) aplicado aos botões circulares de conclusão de hábitos e tarefas.
- **Confetti Celebration**: Acionado ao clicar em *"Marcar Tudo Hoje"* ou *"Concluir Todas"* nas tarefas, utilizando a paleta `['#10b981', '#34d399', '#7dd3fc', '#ffffff']`.
- **Auto-Scroll do Heatmap**: Em telas pequenas, o `ConsistencyHeatmap` rola automaticamente para a direita ao carregar (`scrollLeft = scrollWidth - clientWidth`), garantindo que a semana atual esteja sempre visível.
