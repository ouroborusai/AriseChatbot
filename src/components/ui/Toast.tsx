'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// ARISE TOAST SYSTEM v9.0
// Sistema de notificaciones elegante para feedback de usuario
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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
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
    setIsExiting(false);
    onClose();
  };

  const iconConfig = {
    success: { icon: CheckCircle2, colors: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    error: { icon: AlertCircle, colors: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    warning: { icon: AlertCircle, colors: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    info: { icon: Info, colors: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    loading: { icon: Loader2, colors: 'text-primary animate-spin', bg: 'bg-primary/10', border: 'border-primary/20' },
  };

  const config = iconConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto
        arise-card min-w-[320px] max-w-md p-4
        bg-white/95 backdrop-blur-2xl
        border-l-4 ${config.border}
        shadow-2xl shadow-slate-900/20
        transform transition-all duration-500 ease-arise
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="flex items-start gap-3">
        <div className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
          <Icon size={14} className={config.colors} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar para toasts con duración */}
      {toast.type !== 'loading' && toast.duration && (
        <div className="mt-3 h-0.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.bg.replace('/10', '/30')} animate-shrink`}
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
// ESTILOS GLOBALES (agregar a globals.css)
// ════════════════════════════════════════════════════════════════════════════

/*
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
*/

// ════════════════════════════════════════════════════════════════════════════
// EJEMPLOS DE USO
// ════════════════════════════════════════════════════════════════════════════

/*
// En cualquier componente:
import { useToast } from '@/components/ui/Toast';

function MiComponente() {
  const toast = useToast();

  const handleAction = async () => {
    toast.loading('Procesando...', 'Espere un momento');

    try {
      await someAction();
      toast.success('¡Completado!', 'La acción se realizó correctamente');
    } catch (error) {
      toast.error('Error', 'No se pudo completar la acción');
    }
  };

  return <button onClick={handleAction}>Acción</button>;
}

// En el layout root, envolver con ToastProvider:
import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
*/
