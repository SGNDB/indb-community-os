"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";

const palette: Record<string, string> = {
  submitted: "border-primary/20 bg-primary/10 text-primary",
  "under-review": "border-accent/35 bg-accent/20 text-primary",
  "in-progress": "border-primary/30 bg-primary/15 text-primary",
  completed: "border-accent/30 bg-accent/20 text-accent-foreground dark:text-accent-foreground",
};

const keys: Record<string, string> = {
  submitted: "submitted",
  "under-review": "underReview",
  "in-progress": "inProgress",
  completed: "completed",
};

export function IdeaStatusBadge({status}: {status: string}) {
  const t = useTranslations("Ideas.status");
  const key = keys[status] ?? "submitted";

  return <Badge className={palette[status] ?? palette.submitted}>{t(key)}</Badge>;
}

