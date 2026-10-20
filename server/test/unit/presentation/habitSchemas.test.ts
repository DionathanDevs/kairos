import { serializers } from '../../../src/presentation/schemas/habitSchemas.js';

describe('fast-json-stringify Serializers Unit Tests', () => {
  it('should serialize health response and strip unknown properties', () => {
    const raw = serializers.health({
      status: 'ok',
      time: '2026-10-19T00:00:00.000Z',
      extraIgnoredField: 'should-not-appear'
    });

    expect(JSON.parse(raw)).toEqual({
      status: 'ok',
      time: '2026-10-19T00:00:00.000Z'
    });
  });

  it('should serialize habitItem response accurately', () => {
    const payload = {
      id: 'habit-123',
      title: 'Meditar',
      description: '10 minutos pela manhã',
      color: '#10b981',
      order_index: 0,
      created_at: '2026-10-19T12:00:00.000Z'
    };

    const raw = serializers.habitItem(payload);
    expect(JSON.parse(raw)).toEqual(payload);
  });

  it('should serialize habitsWithWeek response accurately', () => {
    const payload = {
      habits: [
        {
          id: 'habit-1',
          title: 'Estudar TypeScript',
          description: 'Fastify + fast-json-stringify',
          color: '#3b82f6',
          order_index: 1,
          created_at: '2026-10-19T12:00:00.000Z',
          days: [
            { dayName: 'Seg', date: '2026-10-19', completed: true, isToday: true }
          ],
          weekCompletedCount: 1
        }
      ],
      weekDays: [
        { name: 'Seg', date: '2026-10-19', isToday: true }
      ]
    };

    const raw = serializers.habitsWithWeek(payload);
    expect(JSON.parse(raw)).toEqual(payload);
  });

  it('should serialize error response accurately', () => {
    const raw = serializers.error({ error: 'O título do hábito é obrigatório.' });
    expect(raw).toBe('{"error":"O título do hábito é obrigatório."}');
  });
});
