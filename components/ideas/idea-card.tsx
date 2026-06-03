"use client";

import {motion} from "framer-motion";
import {CalendarDays, Lightbulb, Share2, UserRound} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {toast} from "sonner";

import {shareIdeaAction} from "@/app/[locale]/server-actions";
import {IdeaComments} from "@/components/ideas/idea-comments";
import {VoteButton} from "@/components/ideas/vote-button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {IdeaBadge, IdeaWithAuthor} from "@/types/database";

interface IdeaCardProps {
  idea: IdeaWithAuthor;
  totalUsers?: number;
}

export function IdeaCard({idea, totalUsers}: IdeaCardProps) {
  const t = useTranslations("Ideas");
  const locale = useLocale();
  const authorName = idea.author?.full_name ?? idea.author?.username ?? t("unknownAuthor");

  const ideaExtra = idea as IdeaWithAuthor & {supportPercentage?: number; badge?: IdeaBadge; rank?: number | null};
  const supportPercentage = ideaExtra.supportPercentage ?? 0;
  const badge = ideaExtra.badge ?? "new_idea";
  const rank = ideaExtra.rank ?? null;

  const categoryName = idea.category
    ? locale === "ar"
      ? idea.category.name_ar
      : locale === "fr"
        ? idea.category.name_fr
        : idea.category.name_en
    : null;

  async function handleShare() {
    const url = `${window.location.origin}/${window.location.pathname.split("/")[1]}/ideas?id=${idea.id}`;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator).share({url});
        return;
      } catch {
        // user cancelled, do nothing
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied") ?? "Link copied");
    } catch {
      toast.error(t("shareFailed") ?? "Unable to share");
      return;
    }

    const formData = new FormData();
    formData.set("ideaId", idea.id);
    formData.set("locale", locale);
    const result = await shareIdeaAction(formData);
    if (!result.success && result.error === "unauthorized") {
      window.location.href = `/${locale}/login?next=/ideas`;
    }
  }

  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
    >
      <Card className="overflow-hidden border-border/70 shadow-[0_14px_34px_rgba(8,33,56,0.08)]">
        {idea.image_url ? (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={idea.image_url} alt={idea.title} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <CardHeader className="pb-2.5">
          <div className="flex items-start gap-2">
            <CardTitle className="inline-flex items-center gap-2 text-[15px] sm:text-base">
              {rank ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F4C75] to-[#27C5D8] text-[10px] font-bold text-white">
                  {rank}
                </span>
              ) : null}
              <Lightbulb size={16} className="shrink-0" />
              <span>{idea.title}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 sm:space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={13} />
              {authorName}
            </span>
            {categoryName ? (
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb size={13} />
                {categoryName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              {new Date(idea.created_at).toLocaleDateString(locale)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <VoteButton
              ideaId={idea.id}
              votes={idea.votes_count}
              supportPercentage={supportPercentage}
              badge={badge}
              totalUsers={totalUsers ?? 0}
            />
            <IdeaComments ideaId={idea.id} />
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Share2 size={14} />
              {t("share")}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}
