import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-md border animate-slide-down cursor-pointer
              ${t.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' : ''}
              ${t.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' : ''}
              ${t.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : ''}
              ${t.type === 'info' ? 'bg-brand-500/20 border-brand-500/30 text-brand-300' : ''}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
