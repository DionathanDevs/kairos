import React, { useState, useMemo } from 'react';
import {
  Bot,
  GitBranch,
  ExternalLink,
  Flag,
  Play,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ChevronDown,
  ChevronUp,
  Edit2,
  GitPullRequest,
  Send
} from 'lucide-react';
import type {
  AgentTask,
  AgentTaskStatus,
  AgentTaskLogLevel,
  TaskPriority,
  Language
} from '../types';
import { translations } from '../i18n/translations';

type AgentFilter = 'all' | 'ready' | 'active' | 'done';

interface AgentTaskListProps {
  tasks: AgentTask[];
  lang: Language;
  onEditTask: (task: AgentTask) => void;
  onMarkReady: (taskId: string) => Promise<void>;
  onApproveReview: (task: AgentTask) => Promise<void>;
  onAppendLog: (taskId: string, level: AgentTaskLogLevel, message: string, markBlocked?: boolean) => Promise<void>;
  onCompleteWithArtifact: (taskId: string, artifactUrl: string) => Promise<void>;
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
};

const STATUS_STYLES: Record<AgentTaskStatus, string> = {
  planning: 'bg-dark-bg text-gray-400 border-dark-border',
  ready: 'bg-brand-green/15 text-brand-green border-brand-green/30',
  in_progress: 'bg-sky-500/15 text-brand-cyan border-sky-500/30',
  blocked: 'bg-red-500/15 text-red-400 border-red-500/30',
  in_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  completed: 'bg-brand-green/25 text-brand-greenLight border-brand-green/40'
};

export const AgentTaskList: React.FC<AgentTaskListProps> = ({
  tasks,
  lang,
  onEditTask,
  onMarkReady,
  onApproveReview,
  onAppendLog,
  onCompleteWithArtifact
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [logDrafts, setLogDrafts] = useState<Record<string, string>>({});
  const [artifactDrafts, setArtifactDrafts] = useState<Record<string, string>>({});

  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      if (filter === 'ready') return item.status === 'ready' || item.status === 'planning';
      if (filter === 'active') return item.status === 'in_progress' || item.status === 'blocked';
      if (filter === 'done') return item.status === 'in_review' || item.status === 'completed';
      return true;
    });
  }, [tasks, filter]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      ready: tasks.filter((i) => i.status === 'ready').length,
      active: tasks.filter((i) => i.status === 'in_progress' || i.status === 'blocked').length,
      done: tasks.filter((i) => i.status === 'in_review' || i.status === 'completed').length
    };
  }, [tasks]);

  const handleSendLog = async (taskId: string, level: AgentTaskLogLevel, markBlocked = false) => {
    const text = (logDrafts[taskId] || '').trim();
    if (!text) return;
    await onAppendLog(taskId, level, text, markBlocked);
    setLogDrafts((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleDeliverArtifact = async (taskId: string) => {
    const url = (artifactDrafts[taskId] || '').trim();
    if (!url) return;
    await onCompleteWithArtifact(taskId, url);
    setArtifactDrafts((prev) => ({ ...prev, [taskId]: '' }));
  };

  return (
    <div className="bg-dark-card border border-dark-border/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
      {/* Filter Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-4 mb-4 border-b border-dark-border/60">
        {(
          [
            { id: 'all', label: t.agentTasks.filterAll, count: counts.all },
            { id: 'ready', label: t.agentTasks.filterReady, count: counts.ready },
            { id: 'active', label: t.agentTasks.filterActive, count: counts.active },
            { id: 'done', label: t.agentTasks.filterDone, count: counts.done }
          ] as { id: AgentFilter; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              filter === tab.id
                ? 'bg-dark-bg text-white border-brand-green/50 shadow-sm'
                : 'bg-dark-bg/40 text-gray-400 hover:text-gray-200 border-dark-border'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                filter === tab.id ? 'bg-brand-green/20 text-brand-green' : 'bg-dark-card text-gray-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
          <Bot className="w-8 h-8 text-brand-green/60" />
          <span>{t.agentTasks.emptyState}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const repoHref = task.repository_url.startsWith('http')
              ? task.repository_url
              : `https://github.com/${task.repository_url.replace(/^\/+/, '')}`;

            return (
              <div
                key={task.id}
                className="bg-dark-bg/70 border border-dark-border rounded-2xl p-4 sm:p-5 transition-colors hover:border-dark-subtle"
              >
                {/* Top Row: Title, Status, Priority & Quick Action */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="text-left font-bold text-sm sm:text-base text-white hover:text-brand-green transition-colors flex items-center gap-1.5 group"
                      >
                        <span>{task.title}</span>
                        <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          STATUS_STYLES[task.status]
                        }`}
                      >
                        <span>{t.agentTasks.statuses[task.status]}</span>
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          PRIORITY_STYLES[task.priority]
                        }`}
                      >
                        <Flag className="w-2.5 h-2.5" />
                        <span>{t.tasks.priorities[task.priority]}</span>
                      </span>
                    </div>

                    {/* Repository & Branch Pill */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-300">
                      <a
                        href={repoHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border hover:border-brand-green/50 text-brand-cyan font-mono text-[11px] transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-brand-green" />
                        <span className="truncate max-w-[260px]">{task.repository_url}</span>
                        {task.target_branch && (
                          <span className="text-gray-400">({task.target_branch})</span>
                        )}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>

                      {task.agent_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dark-card border border-dark-border text-[11px] text-gray-400">
                          <Bot className="w-3 h-3 text-brand-green" />
                          <span>{task.agent_name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contextual State Transitions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(task.status === 'planning' || task.status === 'blocked') && (
                      <button
                        type="button"
                        onClick={() => onMarkReady(task.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.agentTasks.markReadyBtn}</span>
                      </button>
                    )}

                    {task.status === 'in_review' && (
                      <button
                        type="button"
                        onClick={() => onApproveReview(task)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.agentTasks.approveReviewBtn}</span>
                      </button>
                    )}

                    {task.artifact_url && (
                      <a
                        href={task.artifact_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-green/15 text-brand-green border border-brand-green/40 hover:bg-brand-green/25 transition-colors"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>{t.agentTasks.openArtifact}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Intent Box */}
                <div className="mt-3 p-3 rounded-xl bg-dark-card border border-dark-border/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {t.agentTasks.intentLabel}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-line">
                    {task.intent}
                  </p>
                  {task.acceptance_criteria && (
                    <div className="mt-2 pt-2 border-t border-dark-border/50 text-xs text-gray-400">
                      <span className="font-semibold text-gray-300">{t.agentTasks.criteriaLabel}: </span>
                      <span>{task.acceptance_criteria}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Logs Toggle */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-green transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-brand-green" />
                    <span>
                      {t.agentTasks.logsToggle} ({task.logs?.length || 0})
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded History & Agent Simulation Controls */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dark-border/60 space-y-3">
                    {/* Log Entries */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(task.logs || []).map((log) => (
                        <div
                          key={log.id}
                          className="text-xs p-2 rounded-lg bg-dark-card border border-dark-border/60 flex items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {log.level === 'impediment' || log.level === 'error' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            ) : (
                              <Terminal className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                            )}
                            <span className="text-gray-200 break-words">{log.message}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                            {new Date(log.created_at).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Log / Impediment Input */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={logDrafts[task.id] || ''}
                        onChange={(e) =>
                          setLogDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        placeholder={t.agentTasks.addLogPlaceholder}
                        className="flex-1 px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-gray-500 outline-none focus:border-brand-green"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendLog(task.id, 'progress', false)}
                          className="px-3 py-2 rounded-xl bg-dark-card hover:bg-dark-cardHover border border-dark-border text-xs font-semibold text-gray-200 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-brand-green" />
                          <span>{t.agentTasks.sendProgressBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendLog(task.id, 'impediment', true)}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t.agentTasks.sendImpedimentBtn}</span>
                        </button>
                      </div>
                    </div>

                    {/* Deliver Artifact / PR URL */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={artifactDrafts[task.id] || ''}
                        onChange={(e) =>
                          setArtifactDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        placeholder={t.agentTasks.completePlaceholder}
                        className="flex-1 px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-gray-500 outline-none focus:border-brand-green"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeliverArtifact(task.id)}
                        className="px-3.5 py-2 rounded-xl bg-brand-green text-black hover:bg-brand-greenLight text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>{t.agentTasks.completeBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
