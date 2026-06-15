"use client";

import {cn} from "@/lib/utils/cn";

export interface ReactionDef {
  type: string;
  emoji: string;
}

export function ReactionSummary({
  counts,
  reactions,
  onOpen,
  id,
  highlight = false,
  className,
}: {
  counts: Record<string, number>;
  reactions: ReactionDef[];
  onOpen: () => void;
  id: string;
  highlight?: boolean;
  className?: string;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return <div id={id} className="scroll-mt-24" />;
  }

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 rounded-lg transition-all duration-500",
        highlight ? "ring-2 ring-primary/40 bg-primary/5" : "",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => {
            const def = reactions.find((r) => r.type === type);
            if (!def) return null;
            return (
              <span key={type} className="inline-flex items-center gap-1">
                <span className="text-base">{def.emoji}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </span>
            );
          })}
      </button>
    </div>
  );
}
