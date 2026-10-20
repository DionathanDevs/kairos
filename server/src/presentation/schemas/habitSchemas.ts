import fastJsonStringify, { type Schema } from 'fast-json-stringify';

export const errorResponseSchema: Schema = {
  type: 'object',
  properties: {
    error: { type: 'string' }
  },
  required: ['error']
};

export const healthResponseSchema: Schema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    time: { type: 'string' }
  },
  required: ['status', 'time']
};

export const habitItemSchema: Schema = {
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
  type: 'object',
  properties: {
    success: { type: 'boolean' }
  },
  required: ['success']
};

export const toggleHabitResponseSchema: Schema = {
  type: 'object',
  properties: {
    completed: { type: 'boolean' }
  },
  required: ['completed']
};

export const markAllTodayResponseSchema: Schema = {
  type: 'object',
  properties: {
    updatedCount: { type: 'integer' }
  },
  required: ['updatedCount']
};

export const resetWeekResponseSchema: Schema = {
  type: 'object',
  properties: {
    resetCount: { type: 'integer' }
  },
  required: ['resetCount']
};

export const commonErrorResponses = {
  400: errorResponseSchema,
  404: errorResponseSchema,
  422: errorResponseSchema,
  500: errorResponseSchema
};

export const routeSchemas = {
  health: {
    response: {
      200: healthResponseSchema,
      ...commonErrorResponses
    }
  },
  getHabits: {
    response: {
      200: habitsWithWeekResponseSchema,
      ...commonErrorResponses
    }
  },
  getStats: {
    response: {
      200: dashboardStatsResponseSchema,
      ...commonErrorResponses
    }
  },
  getHeatmap: {
    querystring: {
      type: 'object',
      properties: {
        weeks: { type: 'string' }
      }
    },
    response: {
      200: heatmapResponseSchema,
      ...commonErrorResponses
    }
  },
  createHabit: {
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string' }
      }
    },
    response: {
      201: habitItemSchema,
      ...commonErrorResponses
    }
  },
  updateHabit: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string' }
      }
    },
    response: {
      200: habitItemSchema,
      ...commonErrorResponses
    }
  },
  deleteHabit: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    response: {
      200: deleteHabitResponseSchema,
      ...commonErrorResponses
    }
  },
  toggleHabit: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    body: {
      type: 'object',
      properties: {
        date: { type: 'string' }
      }
    },
    response: {
      200: toggleHabitResponseSchema,
      ...commonErrorResponses
    }
  },
  markAllToday: {
    response: {
      200: markAllTodayResponseSchema,
      ...commonErrorResponses
    }
  },
  resetWeek: {
    response: {
      200: resetWeekResponseSchema,
      ...commonErrorResponses
    }
  }
};

/**
 * Compiladores pre-construídos via fast-json-stringify
 * para serialização direta sem JSON.stringify.
 */
export const serializers = {
  compile: (schema: Schema) => fastJsonStringify(schema),
  error: fastJsonStringify(errorResponseSchema),
  health: fastJsonStringify(healthResponseSchema),
  habitItem: fastJsonStringify(habitItemSchema),
  habitsWithWeek: fastJsonStringify(habitsWithWeekResponseSchema),
  dashboardStats: fastJsonStringify(dashboardStatsResponseSchema),
  heatmap: fastJsonStringify(heatmapResponseSchema),
  deleteHabit: fastJsonStringify(deleteHabitResponseSchema),
  toggleHabit: fastJsonStringify(toggleHabitResponseSchema),
  markAllToday: fastJsonStringify(markAllTodayResponseSchema),
  resetWeek: fastJsonStringify(resetWeekResponseSchema)
};
