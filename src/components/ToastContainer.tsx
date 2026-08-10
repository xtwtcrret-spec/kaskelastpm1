import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<ToastItem['type'], { bg: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: 'bg-emerald-950/95 border-emerald-500/40', icon: CheckCircle2, iconColor: 'text-emerald-400' },
  error: { bg: 'bg-rose-950/95 border-rose-500/40', icon: XCircle, iconColor: 'text-rose-400' },
  info: { bg: 'bg-slate-900/95 border-white/10', icon: Info, iconColor: 'text-indigo-400' },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-2.5 ${style.bg} backdrop-blur-xl border rounded-2xl px-4 py-3 shadow-2xl min-w-[240px] max-w-sm animate-toast-in`}
    >
      <Icon className={`w-4.5 h-4.5 ${style.iconColor} flex-shrink-0`} />
      <span className="text-xs font-semibold text-white flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-white transition flex-shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 no-print">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
