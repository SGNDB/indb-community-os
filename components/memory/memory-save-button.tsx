"use client";

import {Bookmark, Loader2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {saveMemoryAction, unsaveMemoryAction} from "@/app/[locale]/server-actions";
import {createClient} from "@/lib/supabase/client";
import {cn} from "@/lib/utils/cn";

export function MemorySaveButton({memoryId}: {memoryId: string}) {
  const t = useTranslations("Feed");
  const supabase = useRef(createClient()).current;
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const {data} = await supabase
        .from("saved_memories")
        .select("id")
        .eq("memory_id", memoryId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setSaved(!!data);
        setLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [memoryId, supabase]);

  async function handleToggle() {
    if (pending || loading) return;
    setPending(true);

    const formData = new FormData();
    formData.set("memoryId", memoryId);

    if (saved) {
      const result = await unsaveMemoryAction(formData);
      if (result.success) {
        setSaved(false);
      } else {
        toast.error(t("shareFailed") ?? "Failed to unsave");
      }
    } else {
      const result = await saveMemoryAction(formData);
      if (result.success) {
        setSaved(true);
      } else {
        if (result.error === "unauthorized") {
          const locale = document.documentElement.lang || "en";
          window.location.href = `/${locale}/login`;
          return;
        }
        toast.error(t("shareFailed") ?? "Failed to save");
      }
    }

    setPending(false);
  }

  if (loading) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm transition",
        saved
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Bookmark size={16} className={saved ? "fill-primary" : ""} />
      )}
      {saved ? t("saved") : t("save")}
    </button>
  );
}
