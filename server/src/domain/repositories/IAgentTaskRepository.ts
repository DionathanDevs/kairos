import type { AgentTask, AgentTaskStatus } from '../entities/AgentTask.js';
import type { AgentTaskLog } from '../entities/AgentTaskLog.js';

export interface IAgentTaskRepository {
  findAll(status?: AgentTaskStatus): AgentTask[];
  findById(id: string): AgentTask | null;
  claimNextReadyTask(agentName?: string): AgentTask | null;
  save(task: AgentTask): void;
  delete(id: string): boolean;
  getNextOrderIndex(): number;
  addLog(log: AgentTaskLog): void;
  findLogsByTaskId(taskId: string): AgentTaskLog[];
  findLogsByTaskIds(taskIds: string[]): Map<string, AgentTaskLog[]>;
}
