import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, Flag, GitBranch, Sparkles, Clock } from 'lucide-react';
import type { AgentTask, AgentTaskStatus, TaskPriority, Language } from '../types';
import { translations } from '../i18n/translations';
import { ConfirmModal } from './ConfirmModal';

interface AgentTaskModalProps {
  isOpen: boolean;
  taskToEdit: AgentTask | null;
  lang: Language;
  onClose: () => void;
  onSave: (input: {
    title: string;
    intent: string;
    repository_url: string;
    target_branch: string;
    acceptance_criteria: string;
    description: string;
    priority: TaskPriority;
    status: AgentTaskStatus;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: 'high',
    activeClass: 'bg-red-500/20 border-red-500 text-red-300 ring-1 ring-red-500/50',
    inactiveClass: 'bg-dark-bg border-dark-border text-gray-400 hover:border-red-500/40 hover:text-red-300'
  },
  {
    value: 'medium',
    activeClass: 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50',
    inactiveClass: 'bg-dark-bg border-dark-border text-gray-400 hover:border-amber-500/40 hover:text-amber-300'
  },
  {
    value: 'low',
    activeClass: 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500/50',
    inactiveClass: 'bg-dark-bg border-dark-border text-gray-400 hover:border-sky-500/40 hover:text-sky-300'
  }
];

export const AgentTaskModal: React.FC<AgentTaskModalProps> = ({
  isOpen,
  taskToEdit,
  lang,
  onClose,
  onSave,
  onDelete
}) => {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [intent, setIntent] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<AgentTaskStatus>('ready');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setIntent(taskToEdit.intent || '');
      setRepositoryUrl(taskToEdit.repository_url || '');
      setTargetBranch(taskToEdit.target_branch || '');
      setAcceptanceCriteria(taskToEdit.acceptance_criteria || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'medium');
      setStatus(taskToEdit.status || 'planning');
    } else {
      setTitle('');
      setIntent('');
      setRepositoryUrl('');
      setTargetBranch('main');
      setAcceptanceCriteria('');
      setDescription('');
      setPriority('medium');
      setStatus('ready');
    }
    setValidationError(null);
    setShowDeleteConfirm(false);
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedIntent = intent.trim();
    const trimmedRepo = repositoryUrl.trim();

    if (!trimmedTitle) {
      setValidationError(
        lang === 'pt' ? 'O título da tarefa é obrigatório.' : 'Task title is required.'
      );
      return;
    }
    if (!trimmedIntent) {
      setValidationError(
        lang === 'pt'
          ? 'A intenção da tarefa para o agente é obrigatória.'
          : 'Task intent for the agent is required.'
      );
      return;
    }
    if (!trimmedRepo) {
      setValidationError(
        lang === 'pt'
          ? 'O repositório referenciado é obrigatório.'
          : 'Referenced repository is required.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      await onSave({
        title: trimmedTitle,
        intent: trimmedIntent,
        repository_url: trimmedRepo,
        target_branch: targetBranch.trim(),
        acceptance_criteria: acceptanceCriteria.trim(),
        description: description.trim(),
        priority,
        status
      });
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Erro ao salvar a tarefa de IA.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToEdit || !onDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(taskToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Erro ao excluir a tarefa.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 transition-opacity">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative z-10 w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-dark-card border border-dark-border rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 pb-8 flex flex-col justify-between shadow-2xl transition-all">
          <div>
            <div className="sm:hidden w-12 h-1.5 bg-dark-border rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-4 border-b border-dark-border/60">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <span>{taskToEdit ? t.agentTasks.modal.editTitle : t.agentTasks.modal.createTitle}</span>
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-dark-cardHover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t.agentTasks.modal.titleLabel} *
                </label>
                <span className={`text-[11px] ${title.length > 120 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.agentTasks.modal.titlePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
              />
            </div>

            {/* Repository & Target Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {t.agentTasks.modal.repoLabel} *
                </label>
                <input
                  type="text"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder={t.agentTasks.modal.repoPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {t.agentTasks.modal.branchLabel}
                </label>
                <div className="relative">
                  <GitBranch className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    placeholder={t.agentTasks.modal.branchPlaceholder}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Intent (Prompt / Goal) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                {t.agentTasks.modal.intentLabel} *
              </label>
              <textarea
                rows={3}
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder={t.agentTasks.modal.intentPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all resize-none"
              />
            </div>

            {/* Acceptance Criteria & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {t.agentTasks.modal.criteriaLabel}
                </label>
                <input
                  type="text"
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder={t.agentTasks.modal.criteriaPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-xs sm:text-sm outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {t.agentTasks.modal.descLabel}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.agentTasks.modal.descPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Initial Queue State (Ready vs Planning) */}
            {!taskToEdit && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  {t.agentTasks.modal.statusLabel}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus('ready')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      status === 'ready'
                        ? 'bg-brand-green/15 border-brand-green text-brand-green ring-1 ring-brand-green/40'
                        : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.agentTasks.modal.readyNowOption}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('planning')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      status === 'planning'
                        ? 'bg-brand-green/15 border-brand-green text-brand-green ring-1 ring-brand-green/40'
                        : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.agentTasks.modal.planningOption}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {t.tasks.modal.priorityLabel}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      priority === opt.value ? opt.activeClass : opt.inactiveClass
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{t.tasks.priorities[opt.value]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t border-dark-border/60">
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial min-w-[130px] px-5 py-3 text-sm font-semibold rounded-xl border border-dark-border text-gray-300 hover:text-white hover:bg-dark-cardHover transition-colors"
                >
                  {t.agentTasks.modal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial min-w-[140px] px-5 py-3 text-sm font-semibold rounded-xl bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{t.agentTasks.modal.save}</span>
                </button>
              </div>

              {taskToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium pt-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.agentTasks.modal.delete}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={lang === 'pt' ? 'Excluir Tarefa IA' : 'Delete AI Task'}
        message={
          lang === 'pt'
            ? `Tem certeza de que deseja excluir "${taskToEdit?.title}"?`
            : `Are you sure you want to delete "${taskToEdit?.title}"?`
        }
        confirmLabel={lang === 'pt' ? 'Sim, Excluir' : 'Yes, Delete'}
        cancelLabel={lang === 'pt' ? 'Cancelar' : 'Cancel'}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
