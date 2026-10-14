import type { HabitWithWeekLogs, DashboardStats, HeatmapData, Habit } from '../types';

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
  }
};
