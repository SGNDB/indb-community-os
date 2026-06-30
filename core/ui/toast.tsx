"use client";

import {useState, useCallback, type ReactNode} from "react";
import {cn} from "@/lib/utils/cn";
import {X, CheckCircle, AlertCircle, Info, AlertTriangle} from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="size-5 text-green-500" />,
  error: <AlertCircle className="size-5 text-red-500" />,
  info: <Info className="size-5 text-blue-500" />,
  warning: <AlertTriangle className="size-5 text-yellow-500" />,
};

const colors: Record<ToastType, string> = {
  success: "border-green-500/20 bg-green-500/5",
  error: "border-red-500/20 bg-red-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
};

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, {id, type, message}]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    toast: {
      success: (msg: string) => addToast("success", msg),
      error: (msg: string) => addToast("error", msg),
      info: (msg: string) => addToast("info", msg),
      warning: (msg: string) => addToast("warning", msg),
    },
    dismiss: removeToast,
  };
}

export function ToastContainer({toasts, dismiss}: {toasts: Toast[]; dismiss: (id: string) => void}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right",
            colors[t.type],
          )}
        >
          {icons[t.type]}
          <span className="text-sm">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="ml-auto rounded-full p-1 hover:bg-black/10">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
