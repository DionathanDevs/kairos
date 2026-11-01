import type {
  HabitWithWeekLogs,
  DashboardStats,
  HeatmapData,
  Habit,
  Task,
  TaskPriority,
  TaskCategory,
  AgentTask,
  AgentTaskStatus,
  AgentTaskLog,
  AgentTaskLogLevel
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHabits(): Promise<{ habits: HabitWithWeekLogs[]; weekDays: { name: 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb' | 'Dom'; date: string; isToday: boolean }[] }> {
    const res = await fetch(`${API_BASE}/habits`);
    if (!res.ok) throw new Error('Failed to fetch habits');
    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/habits/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getHeatmap(weeks: number = 20): Promise<HeatmapData> {
    const res = await fetch(`${API_BASE}/habits/heatmap?weeks=${weeks}`);
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    return res.json();
  },

  async createHabit(title: string, description: string, color: string = '#10b981'): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, color })
    });
    if (!res.ok) throw new Error('Failed to create habit');
    return res.json();
  },

  async updateHabit(id: string, title: string, description: string, color?: string): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, color })
    });
    if (!res.ok) throw new Error('Failed to update habit');
    return res.json();
  },

  async deleteHabit(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete habit');
  },

  async toggleHabit(id: string, date: string): Promise<{ completed: boolean }> {
    const res = await fetch(`${API_BASE}/habits/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    if (!res.ok) throw new Error('Failed to toggle habit');
    return res.json();
  },

  async markAllToday(): Promise<{ updatedCount: number }> {
    const res = await fetch(`${API_BASE}/habits/actions/mark-all-today`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark all today');
    return res.json();
  },

  async resetWeek(): Promise<{ resetCount: number }> {
    const res = await fetch(`${API_BASE}/habits/actions/reset-week`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset week');
    return res.json();
  },

  // Tasks API
  async getTasks(category?: TaskCategory): Promise<{ tasks: Task[] }> {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE}/tasks${query}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(
    title: string,
    description: string,
    priority: TaskPriority,
    category: TaskCategory
  ): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, category })
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(
    id: string,
    title: string,
    description: string,
    priority: TaskPriority,
    category: TaskCategory
  ): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, category })
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async toggleTask(id: string): Promise<{ completed: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async completeAllTasks(category: TaskCategory): Promise<{ updatedCount: number }> {
    const res = await fetch(`${API_BASE}/tasks/actions/complete-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    if (!res.ok) throw new Error('Failed to complete all tasks');
    return res.json();
  },

  async clearCompletedTasks(category: TaskCategory): Promise<{ deletedCount: number }> {
    const res = await fetch(`${API_BASE}/tasks/actions/clear-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    if (!res.ok) throw new Error('Failed to clear completed tasks');
    return res.json();
  },

  // AI Agent Tasks API
  async getAgentTasks(status?: AgentTaskStatus): Promise<{ tasks: AgentTask[] }> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/agent-tasks${query}`);
    if (!res.ok) throw new Error('Failed to fetch AI agent tasks');
    return res.json();
  },

  async createAgentTask(input: {
    title: string;
    intent: string;
    repository_url: string;
    description?: string;
    acceptance_criteria?: string;
    target_branch?: string;
    priority?: TaskPriority;
    status?: AgentTaskStatus;
  }): Promise<AgentTask> {
    const res = await fetch(`${API_BASE}/agent-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to create AI agent task');
    return res.json();
  },

  async updateAgentTask(
    id: string,
    input: {
      title: string;
      intent: string;
      repository_url: string;
      description?: string;
      acceptance_criteria?: string;
      target_branch?: string;
      priority?: TaskPriority;
      status?: AgentTaskStatus;
      artifact_url?: string;
    }
  ): Promise<AgentTask> {
    const res = await fetch(`${API_BASE}/agent-tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to update AI agent task');
    return res.json();
  },

  async markAgentTaskReady(id: string): Promise<AgentTask> {
    const res = await fetch(`${API_BASE}/agent-tasks/${id}/ready`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to mark AI agent task as ready');
    return res.json();
  },

  async claimNextAgentTask(agentName?: string): Promise<{ task: AgentTask | null }> {
    const res = await fetch(`${API_BASE}/agent-tasks/queue/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_name: agentName })
    });
    if (!res.ok) throw new Error('Failed to claim next AI agent task');
    return res.json();
  },

  async appendAgentTaskLog(
    id: string,
    input: {
      level?: AgentTaskLogLevel;
      message: string;
      metadata?: string;
      mark_blocked?: boolean;
    }
  ): Promise<{ log: AgentTaskLog; task: AgentTask }> {
    const res = await fetch(`${API_BASE}/agent-tasks/${id}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to append AI agent task log');
    return res.json();
  },

  async completeAgentTask(
    id: string,
    input: {
      artifact_url: string;
      summary?: string;
      status?: 'in_review' | 'completed';
    }
  ): Promise<AgentTask> {
    const res = await fetch(`${API_BASE}/agent-tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to complete AI agent task');
    return res.json();
  },

  async deleteAgentTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/agent-tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete AI agent task');
  }
};
