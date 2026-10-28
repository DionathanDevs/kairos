# Funcionalidade: Gerenciamento de Tarefas (Pessoais e Trabalho)

## 1. Visão Geral
Além dos hábitos recorrentes, o Kairos oferece uma aba dedicada de **Tarefas (`Tasks`)** para gerenciar itens acionáveis únicos divididos em dois contextos: **Pessoais (`personal`)** e **Trabalho (`work`)**, classificados por níveis de prioridade.

---

## 2. Regras de Negócio e Domínio (`Task.ts`)

Implementadas na entidade [`Task.ts`](../../server/src/domain/entities/Task.ts):
1. **Título Obrigatório e Limite**: Deve possuir entre `1` e `100` caracteres após `trim()` (`ValidationError` → HTTP `400`).
2. **Prioridades Válidas (`TaskPriority`)**:
   - `'high'` (Alta)
   - `'medium'` (Média — valor padrão)
   - `'low'` (Baixa)
3. **Categorias Válidas (`TaskCategory`)**:
   - `'personal'` (Pessoal — valor padrão)
   - `'work'` (Trabalho)
4. **Estado de Conclusão (`completed`)**: Booleano (`false` por padrão na criação), alternável via `toggleCompleted()`.

---

## 3. Ordenação, Paginação e Experiência de Uso (`TaskList.tsx`)

### 3.1. Carregamento Sob Demanda e Contadores
- A lista de tarefas é carregada sob demanda quando o usuário acessa a aba **Tarefas** (ou atualizada após criações rápidas).
- O menu de navegação (`NavigationMenu.tsx`) exibe um badge com o total global de tarefas pendentes (`!t.completed`), enquanto os seletores de aba interna (**Pessoais** | **Trabalho**) exibem contadores individuais de pendências por contexto.

### 3.2. Regra de Ordenação Inteligente
Dentro de cada categoria, o componente [`TaskList.tsx`](../../client/src/components/TaskList.tsx) ordena as tarefas automaticamente seguindo 3 critérios:
1. **Status de Conclusão**: Tarefas **pendentes** aparecem sempre no topo; tarefas **concluídas** vão para o final da lista (com texto tachado `line-through`).
2. **Prioridade**: Alta (`high` = 0) $\rightarrow$ Média (`medium` = 1) $\rightarrow$ Baixa (`low` = 2).
3. **Ordem de Criação**: `order_index` crescente.

### 3.3. Paginação Incremental ("Mostrar mais")
- Para manter a interface leve em listas extensas, são exibidas inicialmente **10 tarefas (`PAGE_SIZE = 10`)**.
- Caso existam mais tarefas na categoria ativa, o botão **"Mostrar mais"** revela mais 10 itens a cada clique. Ao alternar entre as abas *Pessoais* e *Trabalho*, a paginação retorna para 10 itens.

### 3.4. Ações em Lote por Categoria
Os botões de ação rápida no cabeçalho atuam exclusivamente sobre a categoria selecionada no momento (`personal` ou `work`):
- **Concluir Todas (`POST /api/tasks/actions/complete-all`)**: Marca todas as tarefas da categoria ativa como concluídas e dispara animação de confete + Toast.
- **Limpar Concluídas (`POST /api/tasks/actions/clear-completed`)**: Após confirmação no `ConfirmModal`, remove do banco todas as tarefas já concluídas daquela categoria.

---

## 4. Arquitetura e Arquivos Relacionados

- **Domain**:
  - [`server/src/domain/entities/Task.ts`](../../server/src/domain/entities/Task.ts)
  - [`server/src/domain/repositories/ITaskRepository.ts`](../../server/src/domain/repositories/ITaskRepository.ts)
- **Application**:
  - [`server/src/application/usecases/TaskUseCases.ts`](../../server/src/application/usecases/TaskUseCases.ts)
- **Infrastructure & Presentation**:
  - [`server/src/infrastructure/database/repositories/SQLiteTaskRepository.ts`](../../server/src/infrastructure/database/repositories/SQLiteTaskRepository.ts)
  - [`server/src/presentation/controllers/TaskController.ts`](../../server/src/presentation/controllers/TaskController.ts)
  - [`server/src/presentation/routes/taskRoutes.ts`](../../server/src/presentation/routes/taskRoutes.ts)
- **Frontend**:
  - [`client/src/components/TaskList.tsx`](../../client/src/components/TaskList.tsx)
  - [`client/src/components/TaskModal.tsx`](../../client/src/components/TaskModal.tsx)
