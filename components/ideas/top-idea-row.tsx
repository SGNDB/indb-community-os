"use client";

import {ChevronUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar} from "@/components/ideas/avatar";
import type {IdeaBadge, IdeaWithSupport} from "@/types/database";

const badgeStyles: Record<IdeaBadge, string> = {
  new_idea: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  growing_support: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  popular: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  community_priority: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  top_priority: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};

const badgeTranslationKeys: Record<IdeaBadge, string> = {
  new_idea: "badgeNewIdea",
  growing_support: "badgeGrowingSupport",
  popular: "badgePopular",
  community_priority: "badgeCommunityPriority",
  top_priority: "badgeTopPriority",
};

export function TopIdeaRow({idea}: {idea: IdeaWithSupport}) {
  const t = useTranslations("Ideas");
  const authorName = idea.author?.full_name ?? idea.author?.username ?? t("unknownAuthor");

  function handleClick() {
    const el = document.getElementById(`idea-${idea.id}`);
    if (el) {
      el.scrollIntoView({behavior: "smooth", block: "start"});
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
        <span className="tabular-nums hidden sm:inline">{t("supportPercent", {percent: idea.supportPercentage})}</span>
        {idea.badge ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium hidden sm:inline ${badgeStyles[idea.badge as IdeaBadge]}`}>
            {t(badgeTranslationKeys[idea.badge as IdeaBadge])}
          </span>
        ) : null}
      </div>
    </button>
  );
}
