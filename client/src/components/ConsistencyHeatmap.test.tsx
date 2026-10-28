import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConsistencyHeatmap } from './ConsistencyHeatmap';
import type { HeatmapData } from '../types';

describe('ConsistencyHeatmap Component', () => {
  const mockHeatmapData: HeatmapData = {
    totalActiveDays: 14,
    completionRatePct: 45,
    weeks: [
      [
        { date: '2026-10-05', count: 2, total: 4, level: 2 },
        { date: '2026-10-06', count: 3, total: 4, level: 3 },
        { date: '2026-10-07', count: 0, total: 4, level: 0 },
        { date: '2026-10-08', count: 4, total: 4, level: 4 },
        { date: '2026-10-09', count: 2, total: 4, level: 2 },
        { date: '2026-10-10', count: 1, total: 4, level: 1 },
        { date: '2026-10-11', count: 0, total: 4, level: 0 }
      ],
      [
        { date: '2026-10-12', count: 4, total: 4, level: 4 },
        { date: '2026-10-13', count: 3, total: 4, level: 3 },
        { date: '2026-10-14', count: 4, total: 4, level: 4 },
        { date: '2026-10-15', count: 4, total: 4, level: 4 },
        { date: '2026-10-16', count: 2, total: 4, level: 2 },
        { date: '2026-10-17', count: 0, total: 4, level: 0 },
        { date: '2026-10-18', count: 0, total: 4, level: 0 }
      ]
    ]
  };

  it('renders heatmap title and statistics', () => {
    render(
      <ConsistencyHeatmap
        data={mockHeatmapData}
        lang="pt"
        todayDate="2026-10-16"
      />
    );

    expect(screen.getByText('HISTÓRICO DE CONSISTÊNCIA')).toBeDefined();
    expect(screen.getByText('14')).toBeDefined();
    expect(screen.getByText('45%')).toBeDefined();
  });

  it('renders weekday indicators', () => {
    render(
      <ConsistencyHeatmap
        data={mockHeatmapData}
        lang="pt"
        todayDate="2026-10-16"
      />
    );

    expect(screen.getByText('Seg')).toBeDefined();
    expect(screen.getByText('Qua')).toBeDefined();
    expect(screen.getByText('Sex')).toBeDefined();
    expect(screen.getByText('Dom')).toBeDefined();
  });

  it('highlights the current date square with ring styling', () => {
    const { container } = render(
      <ConsistencyHeatmap
        data={mockHeatmapData}
        lang="pt"
        todayDate="2026-10-16"
      />
    );

    // One square should have ring-1 ring-white/80
    const todaySquare = container.querySelector('.ring-white\\/80');
    expect(todaySquare).toBeDefined();
    expect(todaySquare).not.toBeNull();
  });

  it('auto-scrolls container to the end so current week is visible', () => {
    vi.useFakeTimers();

    const { container } = render(
      <ConsistencyHeatmap
        data={mockHeatmapData}
        lang="pt"
        todayDate="2026-10-16"
      />
    );

    const scrollContainer = container.querySelector('.overflow-x-auto') as HTMLDivElement;
    expect(scrollContainer).not.toBeNull();

    // Mock dimensions for scrolling to end
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 700, configurable: true });

    vi.advanceTimersByTime(100);

    // Expected scrollLeft = 700 - 300 = 400
    expect(scrollContainer.scrollLeft).toBe(400);

    vi.useRealTimers();
  });
});
