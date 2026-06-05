"use client";

import {CalendarDays, Loader2, MapPin, Pencil, Share2, Tag, Trash2, UserRound, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {MemoryComments} from "@/components/memory/memory-comments";
import {MemoryReactions} from "@/components/memory/memory-reactions";
import {MemorySaveButton} from "@/components/memory/memory-save-button";
import {MemoryVerificationBadge} from "@/components/memory/memory-verification-badge";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {deleteMemoryAction, shareMemoryAction} from "@/app/[locale]/server-actions";
import {useCurrentUser} from "@/hooks/use-current-user";
import {Link, useRouter} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/client";
import type {MemoryReactionType, MemoryWithContributor} from "@/types/database";

export function MemoryDetailsClient({
  memory,
  locale,
}: {
  memory: MemoryWithContributor;
  locale: string;
}) {
  const t = useTranslations("Memory");
  const router = useRouter();
  const {userId: clientUserId, loading: userLoading} = useCurrentUser();
  const supabase = useRef(createClient()).current;
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<MemoryReactionType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const {data: {user}} = await supabase.auth.getUser();
      if (user) {
        const {data: myReaction} = await supabase
          .from("memory_reactions")
          .select("reaction_type")
          .eq("memory_id", memory.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (myReaction) {
          setUserReaction(myReaction.reaction_type as MemoryReactionType);
        }
      }
      const {data: allReactions} = await supabase
        .from("memory_reactions")
        .select("reaction_type")
        .eq("memory_id", memory.id);
      const counts: Record<string, number> = {};
      for (const row of allReactions ?? []) {
        counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
      }
      setReactionCounts(counts);
    }
    load();
  }, [memory.id, supabase]);

  const contributorName = memory.contributor?.full_name ?? memory.contributor?.username ?? t("unknownContributor");
  const authorUsername = memory.contributor?.username;
  const isOwner = !!clientUserId && !!memory.contributor_id && clientUserId === memory.contributor_id;

  async function handleShare() {
    const url = `${window.location.origin}/${locale}/memory/${memory.id}`;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator).share({url});
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied") ?? "Memory link copied");
    } catch {
      toast.error(t("shareFailed") ?? "Unable to share");
      return;
    }

    const formData = new FormData();
    formData.set("memoryId", memory.id);
    const result = await shareMemoryAction(formData);
    if (!result.success && result.error === "unauthorized") {
      window.location.href = `/${locale}/login?next=/memory/${memory.id}`;
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/70 shadow-[0_16px_38px_rgba(8,33,56,0.12)]">
        {memory.media_url ? (
          <div className="relative h-72 w-full sm:h-80 md:h-96">
            <img src={memory.media_url} alt={memory.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-muted sm:h-80">
            <span className="text-muted-foreground">{t("noImage")}</span>
          </div>
        )}

        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-primary-soft text-brand-primary">
                {memory.decade ?? memory.year ?? "?"}
              </Badge>
              <MemoryVerificationBadge status={memory.verification_status} />
              {memory.location ? (
                <Badge className="rounded-lg border-primary/15 bg-primary/8 text-primary">
                  <MapPin size={12} className="me-1" />
                  {memory.location}
                </Badge>
              ) : null}
            </div>
            {isOwner && !userLoading ? (
              <div className="flex items-center gap-1">
                <Link
                  href={`/memory/submit?id=${memory.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <Pencil size={14} />
                  {t("edit") ?? "Edit"}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition"
                >
                  <Trash2 size={14} />
                  {t("delete") ?? "Delete"}
                </button>
              </div>
            ) : null}
          </div>
          <CardTitle className="text-2xl leading-tight sm:text-3xl">{memory.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-base leading-7 text-foreground/90">{memory.description ?? memory.title}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {authorUsername ? (
              <Link
                href={`/profile/${authorUsername}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <UserRound size={14} />
                {t("contributedBy", {name: contributorName})}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={14} />
                {t("contributedBy", {name: contributorName})}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {new Date(memory.created_at).toLocaleDateString(locale)}
            </span>
          </div>

          {memory.tags && memory.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <Badge key={tag} className="gap-1 rounded-full border-border/60 px-3 py-1 text-xs">
                  <Tag size={11} />
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <MemoryReactions
              memoryId={memory.id}
              initialCounts={reactionCounts}
              initialUserReaction={userReaction}
              showLabels
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Share2 size={16} />
              {t("share")}
            </button>
            <MemorySaveButton memoryId={memory.id} />
            <MemoryComments memoryId={memory.id} />
          </div>
        </CardContent>
      </Card>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("confirmDeleteTitle") ?? "Delete memory"}</h3>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">{t("deleteConfirm") ?? "Are you sure you want to delete this memory?"}</p>
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t("cancel") ?? "Cancel"}
              </Button>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setShowDeleteConfirm(false);
                  setDeleting(true);
                  const formData = new FormData();
                  formData.set("memoryId", memory.id);
                  const result = await deleteMemoryAction(formData);
                  setDeleting(false);
                  if (result.success) {
                    toast.success(t("memoryDeleted") ?? "Memory deleted");
                    router.refresh();
                    router.push(`/${locale}/memory`);
                  } else {
                    toast.error(result.error ?? "Failed to delete");
                  }
                }}
              >
                <Button type="submit" variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t("confirmDelete") ?? "Delete"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
