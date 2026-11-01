-- 004_create_ai_tasks_tables.sql
CREATE TABLE IF NOT EXISTS ai_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  description TEXT DEFAULT '',
  acceptance_criteria TEXT DEFAULT '',
  repository_url TEXT NOT NULL,
  target_branch TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'planning',
  artifact_url TEXT DEFAULT '',
  agent_name TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_priority ON ai_tasks(status, priority, created_at);

CREATE TABLE IF NOT EXISTS ai_task_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES ai_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task_id ON ai_task_logs(task_id, created_at);
