"use client";

import {motion} from "framer-motion";
import {Heart, Handshake, History, Star} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRef, useState} from "react";
import {toast} from "sonner";

import {reactToMemoryAction} from "@/app/[locale]/server-actions";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils/cn";
import type {MemoryReactionType} from "@/types/database";

const REACTION_TYPES: {key: MemoryReactionType; Icon: typeof Heart; color: string}[] = [
  {key: "love", Icon: Heart, color: "text-red-500"},
  {key: "respect", Icon: Handshake, color: "text-amber-500"},
  {key: "nostalgia", Icon: History, color: "text-blue-500"},
  {key: "important", Icon: Star, color: "text-yellow-500"},
];

export function MemoryReactions({
  memoryId,
  initialCounts,
  initialUserReaction,
  showLabels,
}: {
  memoryId: string;
  initialCounts?: Record<string, number>;
  initialUserReaction?: MemoryReactionType | null;
  showLabels?: boolean;
}) {
  const t = useTranslations("MemoryReactions");
  const supabase = useRef(createClient()).current;
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts ?? {});
  const [userReaction, setUserReaction] = useState<MemoryReactionType | null>(initialUserReaction ?? null);
  const [pending, setPending] = useState<string | null>(null);

  async function handleReact(reactionType: MemoryReactionType) {
    if (pending) return;
    setPending(reactionType);

    const formData = new FormData();
    formData.set("memoryId", memoryId);
    formData.set("reactionType", userReaction === reactionType ? "" : reactionType);

    const prevReaction = userReaction;
    const prevCounts = {...counts};

    if (userReaction === reactionType) {
      setUserReaction(null);
      setCounts((c) => ({...c, [reactionType]: Math.max((c[reactionType] ?? 0) - 1, 0)}));
    } else {
      const newCounts = {...counts};
      if (userReaction) {
        newCounts[userReaction] = Math.max((newCounts[userReaction] ?? 0) - 1, 0);
      }
      newCounts[reactionType] = (newCounts[reactionType] ?? 0) + 1;
      setCounts(newCounts);
      setUserReaction(reactionType);
    }

    const result = await reactToMemoryAction(formData);

    if (!result.success) {
      setUserReaction(prevReaction);
      setCounts(prevCounts);
      if (result.error === "unauthorized") {
        const locale = document.documentElement.lang || "en";
        window.location.href = `/${locale}/login`;
        return;
      }
      toast.error(t("failed") ?? "Reaction failed");
    } else {
      if (result.reaction_counts) {
        setCounts(result.reaction_counts);
      }
      setUserReaction(result.reaction ?? null);
    }

    setPending(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {REACTION_TYPES.map(({key, Icon, color}) => {
        const isActive = userReaction === key;
        const count = counts[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleReact(key)}
            disabled={pending === key}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-sm transition-all",
              isActive
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={15} className={cn(isActive ? color : "")} />
            {showLabels ? (
              <span className="text-xs">{t(key)}</span>
            ) : null}
            {count > 0 ? (
              <span className="tabular-nums text-xs">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
