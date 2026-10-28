# Funcionalidade: Métricas, Sequência Perfeita e Mapa de Consistência

## 1. Visão Geral
O Kairos transforma os registros diários de hábitos em indicadores visuais de disciplina de curto, médio e longo prazo por meio de três componentes analíticos:
1. **Cards de Estatísticas (`StatCards`)**: Sequência Perfeita, Consistência Semanal e Progresso de Hoje.
2. **Gráfico Diário da Semana (`WeeklyChart`)**: Gráfico de barras verticais comparando o volume de hábitos concluídos em cada dia da semana.
3. **Histórico de Consistência (`ConsistencyHeatmap`)**: Mapa de calor de 22 semanas (estilo GitHub) com níveis de intensidade `0..4`, dias ativos e taxa geral.

---

## 2. Regras de Cálculo no Domínio

### 2.1. Sequência Perfeita (`StreakCalculator.ts`)
Um dia é considerado **perfeito** quando o número de hábitos concluídos na data é igual ao total de hábitos ativos ($\text{completedCount} \ge \text{totalHabits}$):
- Se **hoje** já atingiu 100%, a contagem começa em `1` (hoje) e retrocede dia a dia (`ontem`, `anteontem`, etc.) até encontrar um dia incompleto (máximo de 365 dias).
- Se **hoje** ainda **não** atingiu 100%, a sequência não é zerada prematuramente: o algoritmo verifica a partir de **ontem** e mantém a sequência acumulada caso ontem tenha sido perfeito.
- Se não houver hábitos cadastrados (`totalHabits === 0`), a sequência retorna `0`.

### 2.2. Consistência Semanal (`ConsistencyCalculator.ts`)
Calcula a proporção de conclusões na semana atual (Segunda a Domingo, 7 dias):

$$\text{weeklyConsistencyPct} = \min\left(100, \text{round}\left(\frac{\text{totalCompletedInWeek}}{\text{totalHabits} \times 7} \times 100\right)\right)$$

### 2.3. Níveis de Intensidade do Heatmap (`HeatmapCalculator.ts`)
Para cada dia nas últimas $N$ semanas (padrão `22` semanas no cliente):
- **Nível `0`**: $\text{completedCount} = 0$ ou $\text{totalHabits} = 0$
- **Nível `1`**: $0 < \text{ratio} \le 0.25$
- **Nível `2`**: $0.25 < \text{ratio} \le 0.50$
- **Nível `3`**: $0.50 < \text{ratio} \le 0.75$
- **Nível `4`**: $\text{ratio} > 0.75$

Além da matriz de semanas (`weeks: HeatmapDay[][]`), o `GetHeatmapUseCase` calcula:
- **`totalActiveDays`**: Total de dias no período em que pelo menos 1 hábito foi concluído ($\text{count} > 0$).
- **`completionRatePct`**: Taxa geral de conclusão considerando todos os dias até a data de hoje.

---

## 3. Comportamento Visual no Frontend

- **`ConsistencyHeatmap.tsx`**:
  - Alinha os rótulos dos dias da semana (`Seg`, `Qua`, `Sex`, `Dom`) às 7 linhas de cada coluna semanal.
  - Exibe cabeçalho dinâmico com os nomes dos meses (`Jan..Dez`).
  - Faz *auto-scroll* horizontal para o final da linha do tempo em telas móveis para exibir imediatamente a semana atual.
  - Exibe *tooltip* flutuante ao passar o mouse indicando `X / Y hábitos concluídos` e a data `YYYY-MM-DD`.
- **`WeeklyChart.tsx`**:
  - Barras de dias com 100% dos hábitos concluídos recebem a cor **Verde Esmeralda (`bg-brand-green`)**.
  - Barras de dias com conclusão parcial recebem a cor **Azul Ciano Suave (`bg-brand-cyanLight`)**.

---

## 4. Arquitetura e Arquivos Relacionados

- **Domain Services**:
  - [`StreakCalculator.ts`](../../server/src/domain/services/StreakCalculator.ts)
  - [`ConsistencyCalculator.ts`](../../server/src/domain/services/ConsistencyCalculator.ts)
  - [`HeatmapCalculator.ts`](../../server/src/domain/services/HeatmapCalculator.ts)
  - [`DateRangeService.ts`](../../server/src/domain/services/DateRangeService.ts)
- **Application Use Cases**:
  - [`GetDashboardStatsUseCase.ts`](../../server/src/application/usecases/GetDashboardStatsUseCase.ts)
  - [`GetHeatmapUseCase.ts`](../../server/src/application/usecases/GetHeatmapUseCase.ts)
- **Frontend Components**:
  - [`ConsistencyHeatmap.tsx`](../../client/src/components/ConsistencyHeatmap.tsx)
  - [`StatCards.tsx`](../../client/src/components/StatCards.tsx)
  - [`WeeklyChart.tsx`](../../client/src/components/WeeklyChart.tsx)
