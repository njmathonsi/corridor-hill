"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from "react";

interface Toast {
  id: string;
  icon: string;
  title: string;
  sub?: string;
}

interface ToastContextValue {
  showToast: (icon: string, title: string, sub?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const uid = useId();

  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    const id = `${uid}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, icon, title, sub }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3600
    );
  }, [uid]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span className="t-icon">{t.icon}</span>
            <div>
              <div className="t-text">{t.title}</div>
              {t.sub && <div className="t-sub">{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
