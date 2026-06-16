"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import type {IdeaStatus} from "@/types/database";

const palette: Record<IdeaStatus, string> = {
  published: "border-primary/20 bg-primary/10 text-primary",
  interested: "border-accent/35 bg-accent/20 text-primary",
  discussion: "border-primary/30 bg-primary/15 text-primary",
  in_progress: "border-accent/30 bg-accent/20 text-accent-foreground dark:text-accent-foreground",
  completed: "border-accent/30 bg-accent/20 text-accent-foreground dark:text-accent-foreground",
  archived: "border-muted-foreground/20 bg-muted/30 text-muted-foreground",
};

const keys: Record<IdeaStatus, string> = {
  published: "published",
  interested: "interested",
  discussion: "discussion",
  in_progress: "in_progress",
  completed: "completed",
  archived: "archived",
};

export function IdeaStatusBadge({status}: {status: IdeaStatus}) {
  const t = useTranslations("Ideas.status");
  const key = keys[status] ?? "published";

  return <Badge className={palette[status] ?? palette.published}>{t(key)}</Badge>;
}
