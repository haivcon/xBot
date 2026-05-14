import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-300', icon: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-300', icon: 'text-red-400', bar: 'bg-red-400' },
  warning: { bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-300', icon: 'text-amber-400', bar: 'bg-amber-400' },
  info: { bg: 'bg-brand-500/15', border: 'border-brand-500/25', text: 'text-brand-300', icon: 'text-brand-400', bar: 'bg-brand-400' },
};

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const Icon = ICONS[toast.type] || ICONS.info;
  const color = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const duration = toast.duration || 3000;
    const interval = 30;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [toast.duration, toast.id, onDismiss]);

  const handleClick = () => {
    clearInterval(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      onClick={handleClick}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border cursor-pointer overflow-hidden relative
        ${color.bg} ${color.border} ${color.text}
        ${exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <Icon size={18} className={`${color.icon} flex-shrink-0 mt-0.5`} />
      <span className="text-sm font-medium leading-snug flex-1">{toast.message}</span>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
        <div
          className={`h-full ${color.bar} opacity-60 transition-none rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container — bottom center */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col-reverse gap-2 w-[92%] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
