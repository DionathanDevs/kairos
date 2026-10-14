import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import type { Habit, Language } from '../types';
import { translations } from '../i18n/translations';

interface HabitModalProps {
  isOpen: boolean;
  habitToEdit: Habit | null;
  lang: Language;
  onClose: () => void;
  onSave: (title: string, description: string, color: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  '#10b981', // Brand green / emerald
  '#0ea5e9', // Ocean blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4'  // Cyan
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  habitToEdit,
  lang,
  onClose,
  onSave,
  onDelete
}) => {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setColor(habitToEdit.color || '#10b981');
    } else {
      setTitle('');
      setDescription('');
      setColor('#10b981');
    }
    setConfirmDelete(false);
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(title.trim(), description.trim(), color);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!habitToEdit || !onDelete || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onDelete(habitToEdit.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative z-10 w-full sm:max-w-lg bg-dark-card border border-dark-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl overflow-hidden transition-all transform animate-in fade-in slide-in-from-bottom duration-200">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-dark-border rounded-full mx-auto mb-4" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border/60">
          <h2 className="text-lg font-bold text-white">
            {habitToEdit ? t.modal.editTitle : t.modal.createTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-dark-cardHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              {t.modal.titleLabel} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.modal.titlePlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              {t.modal.descLabel}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.modal.descPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border focus:border-brand-green focus:ring-1 focus:ring-brand-green text-white placeholder-gray-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Cor do Hábito
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-card scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-dark-border/60 mt-6">
            {habitToEdit && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-2 text-xs text-gray-400 hover:text-white"
                  >
                    {t.modal.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.modal.delete}</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-dark-border text-gray-300 hover:text-white hover:bg-dark-cardHover transition-colors"
              >
                {t.modal.cancel}
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-green text-black hover:bg-brand-greenLight transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-brand-green/20"
              >
                {isSubmitting ? '...' : t.modal.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
