import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, Flag, User, Briefcase } from 'lucide-react';
import type { Task, TaskCategory, TaskPriority, Language } from '../types';
import { translations } from '../i18n/translations';
import { ConfirmModal } from './ConfirmModal';

interface TaskModalProps {
  isOpen: boolean;
  taskToEdit: Task | null;
  defaultCategory: TaskCategory;
  lang: Language;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    priority: TaskPriority,
    category: TaskCategory
  ) => Promise<void>;
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

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  taskToEdit,
  defaultCategory,
  lang,
  onClose,
  onSave,
  onDelete
}) => {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'medium');
      setCategory(taskToEdit.category || defaultCategory);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory(defaultCategory);
    }
    setValidationError(null);
    setShowDeleteConfirm(false);
  }, [taskToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError(
        lang === 'pt'
          ? 'O nome da tarefa é obrigatório.'
          : 'Task name is required.'
      );
      return;
    }

    if (trimmedTitle.length > 100) {
      setValidationError(
        lang === 'pt'
          ? 'O nome da tarefa não pode ultrapassar 100 caracteres.'
          : 'Task name cannot exceed 100 characters.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      await onSave(trimmedTitle, description.trim(), priority, category);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao salvar a tarefa.');
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
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao excluir a tarefa.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 transition-opacity">
        {/* Click outside to close */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Box */}
        <div className="relative z-10 w-full sm:max-w-lg bg-dark-card border border-dark-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl overflow-hidden transition-all transform animate-in fade-in slide-in-from-bottom duration-200">
          {/* Mobile handle indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-dark-border rounded-full mx-auto mb-4" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-dark-border/60">
            <h2 className="text-lg font-bold text-white">
              {taskToEdit ? t.tasks.modal.editTitle : t.tasks.modal.createTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-dark-cardHover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inline Validation Banner */}
          {validationError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t.tasks.modal.titleLabel} *
                </label>
                <span
                  className={`text-[11px] ${
                    title.length > 100 ? 'text-red-400 font-bold' : 'text-gray-400'
                  }`}
                >
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t.tasks.modal.titlePlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl bg-dark-bg border text-white placeholder-gray-500 text-sm outline-none transition-all ${
                  validationError
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {t.tasks.modal.descLabel}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.tasks.modal.descPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
              />
            </div>

            {/* Category Selector (Personal | Work) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {t.tasks.modal.categoryLabel}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategory('personal')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    category === 'personal'
                      ? 'bg-brand-green/15 border-brand-green text-brand-green ring-1 ring-brand-green/40'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{t.tasks.categories.personal}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('work')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    category === 'work'
                      ? 'bg-brand-green/15 border-brand-green text-brand-green ring-1 ring-brand-green/40'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{t.tasks.categories.work}</span>
                </button>
              </div>
            </div>

            {/* Priority Tag Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {t.tasks.modal.priorityLabel}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRIORITY_OPTIONS.map((opt) => {
                  const isSelected = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected ? opt.activeClass : opt.inactiveClass
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{t.tasks.priorities[opt.value]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-border/60 mt-6">
              {taskToEdit && onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.tasks.modal.delete}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-dark-border text-gray-300 hover:text-white hover:bg-dark-cardHover transition-colors"
                >
                  {t.tasks.modal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{t.tasks.modal.save}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Task Deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={lang === 'pt' ? 'Excluir Tarefa' : 'Delete Task'}
        message={
          lang === 'pt'
            ? `Tem certeza de que deseja excluir a tarefa "${taskToEdit?.title}"?`
            : `Are you sure you want to delete the task "${taskToEdit?.title}"?`
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
