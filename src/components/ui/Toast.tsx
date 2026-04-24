'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2, Zap, ShieldCheck } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// ARISE TOAST SYSTEM v10.0 - DIAMOND PROTOCOL
// Sistema de notificaciones industrial de alta fidelidad
// ════════════════════════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  loading: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// ════════════════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════════════════

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════════════════

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, duration: 5000, ...toast };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    if (newToast.duration && newToast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Convenience methods
  const success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message });

  const error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message, duration: 8000 });

  const warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message });

  const info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message });

  const loading = (title: string, message?: string) =>
    addToast({ type: 'loading', title, message, duration: undefined });

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info, loading }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ════════════════════════════════════════════════════════════════════════════

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), (toast.duration || 5000) - 500);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleAnimationEnd = () => {
    if (isExiting) {
      onClose();
    }
  };

  const iconConfig = {
    success: { icon: CheckCircle2, colors: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    error: { icon: AlertCircle, colors: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    warning: { icon: Zap, colors: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    info: { icon: Info, colors: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    loading: { icon: Loader2, colors: 'text-green-500 animate-spin', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  };

  const config = iconConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[340px] max-w-md p-6
        bg-[#0f172a]/90 backdrop-blur-3xl
        rounded-[32px] border border-white/5
        shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isExiting ? 'translate-x-[120%] opacity-0 scale-90' : 'translate-x-0 opacity-100 scale-100'}
        relative overflow-hidden group
      `}
      onTransitionEnd={handleAnimationEnd}
    >
      {/* GLOW DE FONDO */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 ${config.bg} -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`} />
      
      <div className="flex items-start gap-5 relative z-10">
        <div className={`w-12 h-12 rounded-[18px] ${config.bg} border ${config.border} flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={20} className={config.colors} />
        </div>

        <div className="flex-1 min-w-0 py-1">
          <p className="text-[12px] font-black text-white uppercase tracking-[0.2em] leading-tight italic">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest leading-loose italic">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 500);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-700 hover:bg-white hover:text-slate-900 transition-all duration-500 shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar técnica */}
      {toast.type !== 'loading' && toast.duration && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5 overflow-hidden">
          <div
            className={`h-full ${config.bg.replace('/10', '/60')} shadow-[0_0_10px_#22c55e33]`}
            style={{
              width: '100%',
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS DE ANIMACIÓN
// ════════════════════════════════════════════════════════════════════════════

/*
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
*/
