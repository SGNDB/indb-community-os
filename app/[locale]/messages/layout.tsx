import { ReactNode } from "react";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden bg-card md:h-[calc(100dvh-9rem)] md:flex-row md:rounded-2xl md:border md:border-border/70 md:shadow-sm lg:h-[calc(100dvh-9.5rem)]">
      {children}
    </div>
  );
}
