"use client";

import {Edit3, Loader2, MoreHorizontal, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useEffect, useMemo, useRef, useState, useTransition} from "react";
import {toast} from "sonner";

import {UserAvatar} from "@/components/layout/user-avatar";
import {Button} from "@/components/ui/button";
import {TranslateButton} from "@/components/shared/translate-button";
import {detectContentLanguage, type ContentLanguage} from "@/lib/i18n/detectContentLanguage";
import {deletePostCommentAction, updatePostCommentAction} from "@/app/[locale]/server-actions";
import type {CommentWithAuthor} from "@/types/database";

export function CommentCard({
  commentId,
  author,
  authorAvatarUrl,
  content,
  timeAgo,
  canEdit,
  canDelete,
  onUpdated,
  onDeleted,
}: {
  commentId: string;
  author: string;
  authorAvatarUrl?: string | null;
  content: string;
  timeAgo: string;
  canEdit: boolean;
  canDelete: boolean;
  onUpdated: (comment: CommentWithAuthor) => void;
  onDeleted: (commentId: string) => void;
}) {
  const t = useTranslations("Feed");
  const locale = useLocale();
  const LOCALE_TO_CONTENT_LANG: Record<string, ContentLanguage> = {ar:"ar",fr:"fr",wo:"wo",ff:"ff",snk:"snk"};
  const uiLanguage: ContentLanguage = LOCALE_TO_CONTENT_LANG[locale] ?? "en";
  const contentLanguage = useMemo(() => detectContentLanguage(content), [content]);
  const canTranslate = contentLanguage !== uiLanguage;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const canShowMenu = canEdit || canDelete;

  useEffect(() => {
    setEditValue(content);
  }, [content]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleEdit() {
    setMenuOpen(false);
    setEditing(true);
    setEditValue(content);
  }

  function handleCancel() {
    setEditing(false);
    setEditValue(content);
  }

  function handleSave() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === content || isPending) {
      if (trimmed === content) setEditing(false);
      return;
    }

    const formData = new FormData();
    formData.set("commentId", commentId);
    formData.set("content", trimmed);

    startTransition(async () => {
      const result = await updatePostCommentAction(formData);

      if (!result.success || !result.comment) {
        toast.error(t("commentUpdateFailed"));
        return;
      }

      onUpdated(result.comment);
      setEditing(false);
      toast.success(t("commentUpdated"));
    });
  }

  function handleDelete() {
    if (isPending) return;

    setMenuOpen(false);
    const formData = new FormData();
    formData.set("commentId", commentId);

    startTransition(async () => {
      const result = await deletePostCommentAction(formData);

      if (!result.success) {
        toast.error(t("commentDeleteFailed"));
        return;
      }

      onDeleted(commentId);
      toast.success(t("commentDeleted"));
    });
  }

  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
      <UserAvatar className="h-7 w-7 shrink-0" label={author} avatarUrl={authorAvatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold">{author}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring"
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handleSave} disabled={isPending || !editValue.trim()}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : t("save")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{content}</p>
            {canTranslate ? (
              <TranslateButton text={content} contentType="comment" contentId={commentId} />
            ) : null}
          </>
        )}
      </div>
      {canShowMenu && !editing ? (
        <div className="relative shrink-0" ref={menuRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => setMenuOpen((previous) => !previous)}
            disabled={isPending}
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <MoreHorizontal size={13} />}
          </Button>
          {menuOpen ? (
            <div className="absolute end-0 top-full z-20 mt-1 min-w-[170px] rounded-xl border border-border/60 bg-card py-1 shadow-lg">
              {canEdit ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-foreground transition hover:bg-muted"
                >
                  <Edit3 size={13} />
                  {t("editComment")}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-destructive transition hover:bg-muted"
                >
                  <Trash2 size={13} />
                  {t("deleteComment")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
