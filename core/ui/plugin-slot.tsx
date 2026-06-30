"use client";

import {type ReactNode} from "react";
import {usePluginSlot} from "@/core/plugins/context";

interface PluginSlotProps {
  slot: string;
  children?: ReactNode;
  fallback?: ReactNode;
}

export function PluginSlot({slot, children, fallback}: PluginSlotProps) {
  const items = usePluginSlot(slot);

  if (items.length === 0 && !children) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <>
      {items.length > 0 && (
        <nav aria-label={`Plugin slot: ${slot}`}>
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              {item.key}
            </a>
          ))}
        </nav>
      )}
      {children}
    </>
  );
}
