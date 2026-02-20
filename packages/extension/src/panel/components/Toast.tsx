import React, { useCallback, useState, useRef } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface Props {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

export default function Toast({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium animate-slide-up ${
            t.type === 'success'
              ? 'bg-green-900/90 text-green-200 border border-green-700/50'
              : t.type === 'error'
                ? 'bg-red-900/90 text-red-200 border border-red-700/50'
                : 'bg-card text-primary border border-border'
          }`}
        >
          <span>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
