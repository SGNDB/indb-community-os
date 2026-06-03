"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function IdeasToastHandler({
  ideaUpdated,
  ideaDeleted,
}: {
  ideaUpdated: boolean;
  ideaDeleted: boolean;
}) {
  const t = useTranslations("Ideas");

  useEffect(() => {
    if (ideaUpdated) {
      toast.success(t("ideaUpdated"));
    }
  }, [ideaUpdated, t]);

  useEffect(() => {
    if (ideaDeleted) {
      toast.success(t("ideaDeleted"));
    }
  }, [ideaDeleted, t]);

  return null;
}
