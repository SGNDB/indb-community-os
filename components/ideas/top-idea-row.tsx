"use client";

import {ChevronUp} from "lucide-react";
import type {ReactNode} from "react";

import {Avatar} from "@/components/ideas/avatar";

interface TopIdeaRowProps {
  idea: {
    id: string;
    rank: number | null;
    title: string;
    votes_count: number;
    supportPercentage: number;
    author: {
      avatar_url: string | null;
      full_name: string | null;
      username: string | null;
    } | null;
  };
  authorName: string;
  badgeEl: ReactNode;
}

export function TopIdeaRow({idea, authorName, badgeEl}: TopIdeaRowProps) {
  function doScroll() {
    console.log("topIdeaClick", idea.id);
    const target = document.getElementById(`idea-${idea.id}`);
    if (target) {
      target.scrollIntoView({behavior: "smooth", block: "start"});
      window.history.replaceState(null, "", `#idea-${idea.id}`);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {e.preventDefault(); e.stopPropagation(); doScroll();}}
      onPointerDown={(e) => {e.preventDefault(); e.stopPropagation(); doScroll();}}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border/50 bg-card/50 px-3 py-2.5 text-left transition hover:bg-muted/50 active:scale-[0.98] active:bg-muted/70 sm:px-4 touch-manipulation"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F4C75] to-[#27C5D8] text-[11px] font-bold text-white">
        {idea.rank}
      </span>

      <Avatar author={idea.author} />

      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{idea.title}</span>
        <span className="text-[11px] text-muted-foreground truncate">{authorName}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <ChevronUp size={12} />
          {idea.votes_count}
        </span>
        <span className="tabular-nums hidden sm:inline">{idea.supportPercentage}%</span>
        {badgeEl}
      </div>
    </button>
  );
}
