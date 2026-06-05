"use client";

import {motion} from "framer-motion";
import {Archive, Loader2, MapPin, MoreHorizontal, Pencil, Share2, Tag, Trash2, UserRound, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {MemoryComments} from "@/components/memory/memory-comments";
import {MemoryReactions} from "@/components/memory/memory-reactions";
import {MemorySaveButton} from "@/components/memory/memory-save-button";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {deleteMemoryAction, shareMemoryAction} from "@/app/[locale]/server-actions";
import {useCurrentUser} from "@/hooks/use-current-user";
import {Link, useRouter} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/client";
import type {MemoryReactionType, MemoryWithContributor} from "@/types/database";

export function MemoryCard({
  memory,
}: {
  memory: MemoryWithContributor;
}) {
  const t = useTranslations("Memory");
  const locale = useLocale();
  const router = useRouter();
  const {userId: clientUserId, loading: userLoading} = useCurrentUser();
  const supabase = useRef(createClient()).current;
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<MemoryReactionType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const isOwner = !!clientUserId && !!memory.contributor_id && clientUserId === memory.contributor_id;

  async function handleShare() {
    const url = `${window.location.origin}/${window.location.pathname.split("/")[1]}/memory/${memory.id}`;

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
      window.location.href = `/${locale}/login?next=/memory`;
    }
  }

  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -3}}
      transition={{duration: 0.28, ease: "easeOut"}}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_16px_36px_rgba(8,33,56,0.10)]"
    >
      <Link href={`/memory/${memory.id}`} className="block">
        <div className="relative">
          {memory.media_url ? (
            <img
              src={memory.media_url}
              alt={memory.title}
              className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-56"
            />
          ) : (
            <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-muted sm:h-56">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                <Archive size={32} strokeWidth={1.5} />
                <span className="text-xs font-medium">{t("storyMemory")}</span>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
                {memory.decade ?? memory.year ?? "?"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-base font-semibold leading-tight sm:text-lg">{memory.title}</h3>
            {isOwner && !userLoading ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setMenuOpen((p) => !p); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen ? (
                  <div
                    className="absolute end-0 top-full z-10 mt-1 min-w-[140px] rounded-xl border border-border/60 bg-card py-1 shadow-lg"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Link
                      href={`/memory/submit?id=${memory.id}`}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Pencil size={14} />
                      {t("edit") ?? "Edit memory"}
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                      onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}
                    >
                      <Trash2 size={14} />
                      {t("delete") ?? "Delete memory"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">{memory.description ?? memory.title}</p>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {memory.location ? (
              <Badge className="rounded-lg border-primary/15 bg-primary/8 px-2 py-1 text-[11px] font-medium">
                <MapPin size={12} className="me-1" />
                {memory.location}
              </Badge>
            ) : null}
            <Badge className="rounded-lg border-primary/15 bg-primary/8 px-2 py-1 text-[11px] font-medium">
              <UserRound size={12} className="me-1" />
              {contributorName}
            </Badge>
          </div>

          {memory.tags && memory.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {memory.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
              {memory.tags.length > 4 ? (
                <span className="text-[10px] text-muted-foreground">+{memory.tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="border-t border-border/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MemoryReactions
            memoryId={memory.id}
            initialCounts={reactionCounts}
            initialUserReaction={userReaction}
          />
          <div className="flex items-center gap-1.5">
            <MemoryComments memoryId={memory.id} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Share2 size={14} />
            {t("share")}
          </button>
          <MemorySaveButton memoryId={memory.id} />
        </div>
      </div>

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
    </motion.article>
  );
}
