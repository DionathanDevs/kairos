import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div className="fixed inset-0" onClick={() => !isLoading && onCancel()} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-brand-green/10 text-brand-green border border-brand-green/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-dark-cardHover transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-300 leading-relaxed pl-13">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-dark-border/60">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-dark-border text-gray-300 hover:text-white hover:bg-dark-cardHover transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20'
                : 'bg-brand-green hover:bg-brand-greenLight text-black font-bold shadow-md shadow-brand-green/20'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
