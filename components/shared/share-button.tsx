"use client";

import {Share2} from "lucide-react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

export function ShareButton() {
  const t = useTranslations("Memory");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("shareFailed") ?? "Unable to share");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Share2 size={15} />
      {t("share")}
    </button>
  );
}
