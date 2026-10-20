import fastJsonStringify, { type Schema } from 'fast-json-stringify';

export const errorResponseSchema: Schema = {
  $id: 'errorResponse',
  type: 'object',
  properties: {
    error: { type: 'string' }
  },
  required: ['error']
};

export const healthResponseSchema: Schema = {
  $id: 'healthResponse',
  type: 'object',
  properties: {
    status: { type: 'string' },
    time: { type: 'string' }
  },
  required: ['status', 'time']
};

export const habitItemSchema: Schema = {
  $id: 'habitItem',
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    color: { type: 'string' },
    order_index: { type: 'integer' },
    created_at: { type: 'string' }
  },
  required: ['id', 'title', 'description', 'color', 'order_index', 'created_at']
};

export const dayStatusSchema: Schema = {
  type: 'object',
  properties: {
    dayName: { type: 'string' },
    date: { type: 'string' },
    completed: { type: 'boolean' },
    isToday: { type: 'boolean' }
  },
  required: ['dayName', 'date', 'completed', 'isToday']
};

export const weekDayInfoSchema: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    date: { type: 'string' },
    isToday: { type: 'boolean' }
  },
  required: ['name', 'date', 'isToday']
};

export const habitWithWeekLogsSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    color: { type: 'string' },
    order_index: { type: 'integer' },
    created_at: { type: 'string' },
    days: {
      type: 'array',
      items: dayStatusSchema
    },
    weekCompletedCount: { type: 'integer' }
  },
  required: [
    'id',
    'title',
    'description',
    'color',
    'order_index',
    'created_at',
    'days',
    'weekCompletedCount'
  ]
};

export const habitsWithWeekResponseSchema: Schema = {
  $id: 'habitsWithWeekResponse',
  type: 'object',
  properties: {
    habits: {
      type: 'array',
      items: habitWithWeekLogsSchema
    },
    weekDays: {
      type: 'array',
      items: weekDayInfoSchema
    }
  },
  required: ['habits', 'weekDays']
};

export const dailySummarySchema: Schema = {
  type: 'object',
  properties: {
    dayName: { type: 'string' },
    date: { type: 'string' },
    completedCount: { type: 'integer' },
    totalHabits: { type: 'integer' },
    percentage: { type: 'number' },
    isToday: { type: 'boolean' }
  },
  required: ['dayName', 'date', 'completedCount', 'totalHabits', 'percentage', 'isToday']
};

export const dashboardStatsResponseSchema: Schema = {
  $id: 'dashboardStatsResponse',
  type: 'object',
  properties: {
    perfectStreakDays: { type: 'integer' },
    weeklyConsistencyPct: { type: 'number' },
    todayCompletedCount: { type: 'integer' },
    todayTotalCount: { type: 'integer' },
    todayDayName: { type: 'string' },
    weekDailySummary: {
      type: 'array',
      items: dailySummarySchema
    }
  },
  required: [
    'perfectStreakDays',
    'weeklyConsistencyPct',
    'todayCompletedCount',
    'todayTotalCount',
    'todayDayName',
    'weekDailySummary'
  ]
};

export const heatmapDaySchema: Schema = {
  type: 'object',
  properties: {
    date: { type: 'string' },
    count: { type: 'integer' },
    total: { type: 'integer' },
    level: { type: 'integer' }
  },
  required: ['date', 'count', 'total', 'level']
};

export const heatmapResponseSchema: Schema = {
  $id: 'heatmapResponse',
  type: 'object',
  properties: {
    weeks: {
      type: 'array',
      items: {
        type: 'array',
        items: heatmapDaySchema
      }
    },
    totalActiveDays: { type: 'integer' },
    completionRatePct: { type: 'number' }
  },
  required: ['weeks', 'totalActiveDays', 'completionRatePct']
};

export const deleteHabitResponseSchema: Schema = {
  $id: 'deleteHabitResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean' }
  },
  required: ['success']
};

export const toggleHabitResponseSchema: Schema = {
  $id: 'toggleHabitResponse',
  type: 'object',
  properties: {
    completed: { type: 'boolean' }
  },
  required: ['completed']
};

export const markAllTodayResponseSchema: Schema = {
  $id: 'markAllTodayResponse',
  type: 'object',
  properties: {
    updatedCount: { type: 'integer' }
  },
  required: ['updatedCount']
};

export const resetWeekResponseSchema: Schema = {
  $id: 'resetWeekResponse',
  type: 'object',
  properties: {
    resetCount: { type: 'integer' }
  },
  required: ['resetCount']
};

/**
 * Cache por $id e por referência de objeto para garantir compilação única
 * e liberar a instância interna do Ajv do escopo da closure.
 */
const compilerByIdCache = new Map<string, (doc: any) => string>();
const compilerByRefCache = new WeakMap<Schema, (doc: any) => string>();

function compileCached(schema: Schema): (doc: any) => string {
  const schemaId = (schema as { $id?: string }).$id;
  if (schemaId) {
    const cachedById = compilerByIdCache.get(schemaId);
    if (cachedById) return cachedById;
  }

  const cachedByRef = compilerByRefCache.get(schema);
  if (cachedByRef) return cachedByRef;

  const debugCompiled = fastJsonStringify(schema, { mode: 'debug' as any }) as unknown as {
    serializer: unknown;
    code: string;
  };
  const fnBody = debugCompiled.code.replace(/^validator\nserializer\n/, '');
  const fn = new Function('serializer', fnBody)(debugCompiled.serializer) as (doc: any) => string;

  if (schemaId) {
    compilerByIdCache.set(schemaId, fn);
  }
  compilerByRefCache.set(schema, fn);
  return fn;
}

export const routeSchemas = {
  health: {
    response: { 200: healthResponseSchema }
  },
  getHabits: {
    response: { 200: habitsWithWeekResponseSchema }
  },
  getStats: {
    response: { 200: dashboardStatsResponseSchema }
  },
  getHeatmap: {
    response: { 200: heatmapResponseSchema }
  },
  createHabit: {
    response: { 201: habitItemSchema }
  },
  updateHabit: {
    response: { 200: habitItemSchema }
  },
  deleteHabit: {
    response: { 200: deleteHabitResponseSchema }
  },
  toggleHabit: {
    response: { 200: toggleHabitResponseSchema }
  },
  markAllToday: {
    response: { 200: markAllTodayResponseSchema }
  },
  resetWeek: {
    response: { 200: resetWeekResponseSchema }
  }
};

export const serializers = {
  compile: compileCached,
  error: compileCached(errorResponseSchema),
  health: compileCached(healthResponseSchema),
  habitItem: compileCached(habitItemSchema),
  habitsWithWeek: compileCached(habitsWithWeekResponseSchema),
  dashboardStats: compileCached(dashboardStatsResponseSchema),
  heatmap: compileCached(heatmapResponseSchema),
  deleteHabit: compileCached(deleteHabitResponseSchema),
  toggleHabit: compileCached(toggleHabitResponseSchema),
  markAllToday: compileCached(markAllTodayResponseSchema),
  resetWeek: compileCached(resetWeekResponseSchema)
};
