import { ReactNode } from "react";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-3 -mb-4 flex h-dvh flex-col bg-card sm:-mx-4 sm:-mb-5 md:mx-0 md:mb-0 md:h-[calc(100dvh-9rem)] md:flex-row md:overflow-hidden md:rounded-2xl md:border md:border-border/70 md:bg-card md:shadow-sm">
      {children}
    </div>
  );
}
