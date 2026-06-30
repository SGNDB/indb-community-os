"use client";

import {useEffect, useRef, type ReactNode} from "react";
import {cn} from "@/lib/utils/cn";
import {X} from "lucide-react";

interface PluginDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PluginDialog({open, onClose, title, children, className}: PluginDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[85vh] w-[90vw] max-w-lg rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/50",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <button onClick={onClose} className="ml-auto rounded-full p-1 hover:bg-muted" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
