"use client";

import {Heart, MessageCircle, Trophy, Users} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {OnlineAvatar} from "@/components/presence";
import {Link} from "@/lib/i18n/routing";

export interface Top10Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  votes_count: number;
  comments_count: number;
  participants_count: number;
  supporters_count: number;
  rank_90_day: number | null;
  created_at: string;
  author_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
}

export function Top10Section({ideas}: {ideas: Top10Idea[]}) {
  const t = useTranslations("Ideas");
  const locale = useLocale();

  if (ideas.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={21} className="text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">{t("top10Title")}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("top10Subtitle")}</p>
        </div>
        <Link href="/ideas?tab=top10" className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/80">
          {t("showAll", {count: Math.min(ideas.length, 10)})}
        </Link>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {ideas.slice(0, 10).map((idea, index) => {
          const authorName = idea.author_name ?? idea.author_username ?? t("unknownAuthor");
          return (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-3 transition hover:border-primary/30 hover:bg-background"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-black text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-foreground">{idea.title}</h3>
                <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <OnlineAvatar userId={null} label={authorName} avatarUrl={idea.author_avatar_url} className="h-5 w-5" />
                  <span className="truncate">{authorName}</span>
                  <span>{new Date(idea.created_at).toLocaleDateString(locale, {month: "short", day: "numeric"})}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Heart size={12} />{idea.supporters_count}</span>
                  <span className="inline-flex items-center gap-1"><Users size={12} />{idea.participants_count}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle size={12} />{idea.comments_count}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
