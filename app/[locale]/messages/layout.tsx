import { ReactNode } from "react";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4">
      <div className="flex h-[calc(100dvh-8rem)] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}
