import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { AlertTriangle, X, AlertOctagon, Info, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface Toast {
  id: string;
  message: string;
  severity: string;
  source: string;
  exiting?: boolean;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

const MAX_TOASTS = 3;

const SEVERITY_STYLES: Record<string, { border: string; icon: typeof AlertTriangle }> = {
  fatal: { border: "border-l-red-500", icon: AlertOctagon },
  error: { border: "border-l-red-400", icon: AlertTriangle },
  warning: { border: "border-l-amber-400", icon: AlertCircle },
  info: { border: "border-l-blue-400", icon: Info },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = SEVERITY_STYLES[toast.severity] ?? SEVERITY_STYLES.error;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-lg border border-l-[3px] shadow-lg backdrop-blur-sm max-w-sm bg-surface/95 border-border/50 shadow-black/20",
        style.border,
        toast.exiting ? "toast-exit" : "toast-enter"
      )}
    >
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-foreground truncate">{toast.message}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
          {toast.source} {toast.severity}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => {
        const next = [{ ...toast, id }, ...prev];
        // Remove excess toasts beyond max
        if (next.length > MAX_TOASTS) {
          return next.slice(0, MAX_TOASTS);
        }
        return next;
      });

      // Auto-dismiss after 4s
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  // Listen for new errors via WebSocket
  const handleMessage = useCallback(
    (msg: { type: string; payload: unknown }) => {
      if (msg.type === "new_error") {
        const payload = msg.payload as {
          message?: string;
          severity?: string;
          source?: string;
        };
        addToast({
          message: payload.message ?? "New error detected",
          severity: payload.severity ?? "error",
          source: payload.source ?? "unknown",
        });
      }
    },
    [addToast]
  );

  useWebSocket(handleMessage);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
