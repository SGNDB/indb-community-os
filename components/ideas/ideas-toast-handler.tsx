"use client";

import {useEffect, useRef} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

export function IdeasToastHandler({
  ideaSubmitted,
  ideaUpdated,
  ideaDeleted,
}: {
  ideaSubmitted: boolean;
  ideaUpdated: boolean;
  ideaDeleted: boolean;
}) {
  const t = useTranslations("Ideas");
  const ideaFormT = useTranslations("IdeaForm");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || (!ideaSubmitted && !ideaUpdated && !ideaDeleted)) return;
    handled.current = true;

    if (ideaSubmitted) {
      toast.success(ideaFormT("successMessage"));
    }

    if (ideaUpdated) {
      toast.success(t("ideaUpdated"));
    }

    if (ideaDeleted) {
      toast.success(t("ideaDeleted"));
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("ideaSubmitted");
    nextParams.delete("ideaUpdated");
    nextParams.delete("ideaDeleted");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false});
  }, [ideaSubmitted, ideaUpdated, ideaDeleted, ideaFormT, pathname, router, searchParams, t]);

  return null;
}
