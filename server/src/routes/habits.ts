import { Router } from 'express';
import {
  getAllHabitsWithWeek,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit,
  markAllToday,
  resetWeek,
  getStats,
  getHeatmap
} from '../db.js';

export const habitRouter = Router();

// GET /api/habits - List habits with current week status
habitRouter.get('/', (_req, res) => {
  try {
    const data = getAllHabitsWithWeek();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats - Dashboard analytics
habitRouter.get('/stats', (_req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/heatmap - GitHub commit-style heatmap
habitRouter.get('/heatmap', (req, res) => {
  try {
    const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 20;
    const data = getHeatmap(weeks);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits - Create a new habit
habitRouter.post('/', (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const habit = createHabit(title, description, color);
    res.status(201).json(habit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/habits/:id - Update existing habit
habitRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const updated = updateHabit(id, title, description, color);
    if (!updated) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/habits/:id - Delete a habit
habitRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteHabit(id);
    if (!success) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits/:id/toggle - Toggle completion for a specific date
habitRouter.post('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }
    const result = toggleHabit(id, date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits/mark-all-today - Mark all habits completed for today
habitRouter.post('/actions/mark-all-today', (_req, res) => {
  try {
    const result = markAllToday();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits/reset-week - Reset current week's checkmarks
habitRouter.post('/actions/reset-week', (_req, res) => {
  try {
    const result = resetWeek();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
