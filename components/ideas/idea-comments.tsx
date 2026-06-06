"use client";

import {motion, AnimatePresence} from "framer-motion";
import {
  Edit3,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useEffect, useRef, useState, useTransition} from "react";
import {toast} from "sonner";

import {
  addIdeaCommentAction,
  deleteIdeaCommentAction,
  updateIdeaCommentAction,
} from "@/app/[locale]/server-actions";
import {UserAvatar} from "@/components/layout/user-avatar";
import {createClient} from "@/lib/supabase/client";
import type {IdeaCommentWithAuthor} from "@/types/database";

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return locale === "ar" ? "الآن" : "now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m}${locale === "ar" ? "د" : "m"}`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h}${locale === "ar" ? "س" : "h"}`;
  }
  if (diffSec < 2592000) {
    const d = Math.floor(diffSec / 86400);
    return `${d}${locale === "ar" ? "ي" : "d"}`;
  }
  const month = Math.floor(diffSec / 2592000);
  return `${month}${locale === "ar" ? "ش" : "mo"}`;
}

export function IdeaComments({
  ideaId,
  contentOwnerId,
  onCommentCountChange,
}: {
  ideaId: string;
  contentOwnerId?: string | null;
  onCommentCountChange?: (count: number) => void;
}) {
  const t = useTranslations("Ideas");
  const locale = useLocale();
  const supabase = useRef(createClient()).current;
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<IdeaCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [editPending, startEditTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchComments() {
      setLoading(true);
      const {data} = await supabase
        .from("idea_comments")
        .select("*, author:profiles!idea_comments_author_id_fkey(id, username, full_name, avatar_url)")
        .eq("idea_id", ideaId)
        .order("created_at", {ascending: true});

      if (!cancelled) {
        setComments((data ?? []) as unknown as IdeaCommentWithAuthor[]);
        setLoading(false);
      }
    }

    fetchComments();
    return () => { cancelled = true; };
  }, [open, ideaId, supabase]);

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || addPending) return;

    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("content", trimmed);

    startAddTransition(async () => {
      const result = await addIdeaCommentAction(formData);

      if (!result.success) {
        if (result.error === "unauthorized") {
          window.location.href = `/${locale}/login?next=/ideas`;
          return;
        }
        toast.error(t("commentFailed") ?? "Failed to add comment");
        return;
      }

      if (result.comment) {
        setComments((prev) => [...prev, result.comment!]);
        setInput("");
        onCommentCountChange?.(comments.length + 1);
      }
    });
  }

  async function handleDelete(commentId: string) {
    if (deletePending) return;

    const formData = new FormData();
    formData.set("commentId", commentId);

    startDeleteTransition(async () => {
      const result = await deleteIdeaCommentAction(formData);

      if (!result.success) {
        toast.error(t("commentDeleteFailed") ?? "Failed to delete comment");
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(comments.length - 1);
      toast.success(t("commentDeleted"));
    });
  }

  function startEditing(comment: IdeaCommentWithAuthor) {
    setOpenMenuCommentId(null);
    setEditingCommentId(comment.id);
    setEditInput(comment.content);
  }

  function cancelEditing() {
    setEditingCommentId(null);
    setEditInput("");
  }

  async function handleUpdate(commentId: string) {
    const trimmed = editInput.trim();
    if (!trimmed || editPending) return;

    const formData = new FormData();
    formData.set("commentId", commentId);
    formData.set("content", trimmed);

    startEditTransition(async () => {
      const result = await updateIdeaCommentAction(formData);

      if (!result.success || !result.comment) {
        toast.error(t("commentUpdateFailed"));
        return;
      }

      setComments((prev) => prev.map((comment) => (
        comment.id === result.comment!.id ? result.comment! : comment
      )));
      setEditingCommentId(null);
      setEditInput("");
      toast.success(t("commentUpdated"));
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <MessageSquare size={16} />
        {t("commentsWithCount", {count: comments.length})}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="comments-section"
            initial={{height: 0, opacity: 0}}
            animate={{height: "auto", opacity: 1}}
            exit={{height: 0, opacity: 0}}
            transition={{duration: 0.2, ease: "easeInOut"}}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-3">
                  {t("noCommentsYet")}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {comments.map((comment) => {
                    const commentAuthorName = comment.author?.full_name ?? comment.author?.username ?? t("unknownAuthor");
                    const isOwn = currentUserId === comment.author_id;
                    const canEdit = isOwn;
                    const canDelete = isOwn || (!!currentUserId && currentUserId === contentOwnerId);
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <div key={comment.id} className="flex gap-2.5">
                        <UserAvatar
                          label={commentAuthorName}
                          avatarUrl={comment.author?.avatar_url}
                          className="mt-0.5 h-7 w-7 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium">{commentAuthorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(comment.created_at, locale)}
                            </span>
                          </div>
                          {isEditing ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editInput}
                                onChange={(event) => setEditInput(event.target.value)}
                                rows={2}
                                className="w-full resize-none rounded-xl border border-border/60 bg-card px-3 py-2 text-sm outline-none ring-primary/30 focus:ring"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdate(comment.id)}
                                  disabled={editPending || !editInput.trim()}
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs text-primary-foreground disabled:opacity-50"
                                >
                                  {editPending ? <Loader2 size={13} className="animate-spin" /> : null}
                                  {t("save")}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={editPending}
                                  className="inline-flex min-h-9 items-center rounded-lg px-3 text-xs text-muted-foreground hover:bg-muted"
                                >
                                  {t("cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base text-foreground/90 mt-0.5">{comment.content}</p>
                          )}
                        </div>
                        {canDelete && !isEditing ? (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setOpenMenuCommentId((previous) => previous === comment.id ? null : comment.id)}
                              disabled={deletePending}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                            >
                              {deletePending ? <Loader2 size={12} className="animate-spin" /> : <MoreHorizontal size={14} />}
                            </button>
                            {openMenuCommentId === comment.id ? (
                              <div className="absolute end-0 top-full z-20 mt-1 min-w-[170px] rounded-xl border border-border/60 bg-card py-1 shadow-lg">
                                {canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => startEditing(comment)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-foreground hover:bg-muted"
                                  >
                                    <Edit3 size={13} />
                                    {t("editComment")}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuCommentId(null);
                                    handleDelete(comment.id);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-destructive hover:bg-muted"
                                >
                                  <Trash2 size={13} />
                                  {t("deleteComment")}
                                </button>
                              </div>
                          ) : null}
                          </div>
                        ) : null}
                        </div>
                    );
                  })}
                </div>
              )}

              {currentUserId ? (
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("commentPlaceholder")}
                    rows={1}
                    className="min-h-0 flex-1 resize-none rounded-xl border border-border/60 bg-card px-3 py-2 text-sm max-sm:text-base outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring"
                  />
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={addPending || !input.trim()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {addPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <SendHorizonal size={16} />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-2">
                  <a
                    href={`/${locale}/login?next=/ideas`}
                    className="text-primary hover:underline"
                  >
                    {t("loginToComment") ?? "Log in to comment"}
                  </a>
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
