# Funcionalidade: Rastreamento de Hábitos Diários

## 1. Visão Geral
O módulo de **Hábitos Diários** é o núcleo do Kairos. Ele permite cadastrar hábitos recorrentes com metas diárias descritivas, acompanhar a execução ao longo da semana atual (Segunda a Domingo) e acionar comandos rápidos de produtividade.

---

## 2. Regras de Negócio e Invariantes de Domínio

Implementadas na entidade [`Habit.ts`](../../server/src/domain/entities/Habit.ts) e [`HabitLog.ts`](../../server/src/domain/entities/HabitLog.ts):
1. **Título Obrigatório**: O nome do hábito não pode ser vazio ou conter apenas espaços (`ValidationError` → HTTP `400`).
2. **Limite de Caracteres**: O título do hábito possui limite máximo de **100 caracteres** (`ValidationError` → HTTP `400`).
3. **Cor Identificadora**: Caso não informada, assume o Verde Esmeralda padrão (`#10b981`).
4. **Ordenação (`order_index`)**: Novos hábitos recebem `orderIndex = totalHabitsCount`, preservando a ordem de criação na listagem.
5. **Unicidade Diária**: A tabela `habit_logs` aplica a restrição `UNIQUE(habit_id, date)` onde `date` segue o formato `YYYY-MM-DD`.
6. **Exclusão em Cascata**: Ao excluir um hábito, todos os seus logs históricos são removidos (`ON DELETE CASCADE` + limpeza explícita no repositório).

---

## 3. Comportamento da Interface (`HabitGrid` & `HabitModal`)

### 3.1. Modo Foco "Hoje" vs Modo Expandido "7 Dias"
No componente [`HabitGrid.tsx`](../../client/src/components/HabitGrid.tsx):
- **Modo Padrão (Apenas Hoje)**: Exibe o título/descrição do hábito à esquerda e um único botão circular de check correspondente ao dia atual (`isToday = true`) à direita. Ideal para visualização limpa em dispositivos móveis sem barra de rolagem horizontal.
- **Modo Expandido (Todos os 7 Dias)**: Ao clicar em *"Expandir todos os dias"*, exibe a matriz completa de Segunda (`Seg`/`Mon`) a Domingo (`Dom`/`Sun`), destacando o dia atual com um ponto verde (`bg-brand-green`).

### 3.2. Atualização Otimista (*Optimistic UI*)
Ao clicar em qualquer círculo de conclusão (`handleToggleDay` em [`App.tsx`](../../client/src/App.tsx)):
1. O estado local `habits` é atualizado imediatamente no React (disparando a animação `animate-check-pop`).
2. A chamada `POST /api/habits/:id/toggle` é enviada em paralelo.
3. Em seguida, `getStats()` e `getHeatmap(22)` são atualizados silenciosamente.
4. Se a requisição falhar, `loadData()` recarrega o estado real do servidor (rollback automático).

### 3.3. Ações Rápidas no Cabeçalho (`Header.tsx`)
- **Marcar Tudo Hoje (`POST /api/habits/actions/mark-all-today`)**: Marca todos os hábitos como concluídos na data atual, dispara celebração com `canvas-confetti` e exibe um *Toast* de confirmação.
- **Resetar Semana (`POST /api/habits/actions/reset-week`)**: Abre o [`ConfirmModal.tsx`](../../client/src/components/ConfirmModal.tsx) solicitando confirmação antes de limpar os registros de Segunda a Domingo da semana corrente.

---

## 4. Arquitetura e Arquivos Relacionados

- **Domain**:
  - [`server/src/domain/entities/Habit.ts`](../../server/src/domain/entities/Habit.ts)
  - [`server/src/domain/entities/HabitLog.ts`](../../server/src/domain/entities/HabitLog.ts)
  - [`server/src/domain/services/DateRangeService.ts`](../../server/src/domain/services/DateRangeService.ts)
- **Application Use Cases**:
  - [`GetHabitsWithWeekUseCase.ts`](../../server/src/application/usecases/GetHabitsWithWeekUseCase.ts)
  - [`CreateHabitUseCase.ts`](../../server/src/application/usecases/CreateHabitUseCase.ts)
  - [`UpdateHabitUseCase.ts`](../../server/src/application/usecases/UpdateHabitUseCase.ts)
  - [`DeleteHabitUseCase.ts`](../../server/src/application/usecases/DeleteHabitUseCase.ts)
  - [`ToggleHabitLogUseCase.ts`](../../server/src/application/usecases/ToggleHabitLogUseCase.ts)
  - [`MarkAllTodayUseCase.ts`](../../server/src/application/usecases/MarkAllTodayUseCase.ts)
  - [`ResetWeekUseCase.ts`](../../server/src/application/usecases/ResetWeekUseCase.ts)
- **Frontend**:
  - [`client/src/components/HabitGrid.tsx`](../../client/src/components/HabitGrid.tsx)
  - [`client/src/components/HabitModal.tsx`](../../client/src/components/HabitModal.tsx)
