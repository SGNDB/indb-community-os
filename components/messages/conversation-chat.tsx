"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Archive, ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { ConversationMessageWithSender } from "@/lib/data/conversations";

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

interface ConversationChatProps {
  conversationId: string;
  initialMessages: ConversationMessageWithSender[];
  currentUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  isArchived: boolean;
  conversationTitle: string;
  conversationType: string;
}

export function ConversationChat({
  conversationId,
  initialMessages,
  currentUserId,
  otherUserName,
  otherUserAvatarUrl,
  isArchived,
  conversationTitle,
  conversationType,
}: ConversationChatProps) {
  const t = useTranslations("Messages");
  const locale = useLocale();
  const rtl = locale === "ar";
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selfLabel = rtl ? "أنت" : "You";

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Record<string, unknown>;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id as string,
                conversation_id: newMsg.conversation_id as string,
                sender_id: newMsg.sender_id as string,
                message: newMsg.message as string,
                created_at: newMsg.created_at as string,
                read_at: newMsg.read_at as string | null,
                sender: null,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    async function markRead() {
      const { markConversationReadAction } = await import("@/app/[locale]/server-actions");
      await markConversationReadAction(conversationId);
    }
    markRead();
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || isArchived) return;
    setSending(true);
    setError(null);

    const formData = new FormData();
    formData.set("conversationId", conversationId);
    formData.set("message", trimmed);

    const { sendConversationMessageAction } = await import("@/app/[locale]/server-actions");
    const res = await sendConversationMessageAction(formData);

    if (res.success && res.message) {
      setMessages((prev) => [
        ...prev,
        {
          id: res.message!.id,
          conversation_id: conversationId,
          sender_id: currentUserId,
          message: trimmed,
          created_at: res.message!.created_at,
          read_at: null,
          sender: null,
        },
      ]);
      setInput("");
    } else {
      setError(res.error ?? "submitFailed");
    }
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <Link
          href="/messages"
          className="flex md:hidden items-center justify-center rounded-full p-1 text-muted-foreground hover:bg-muted transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <UserAvatar label={otherUserName} avatarUrl={otherUserAvatarUrl} className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{otherUserName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversationType === "graatek" ? "Gar3tak" : t("idea")}: {conversationTitle}
          </p>
        </div>
        {isArchived && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Archive size={12} />
            {t("archived")}
          </span>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}
              dir="ltr"
            >
              <div className={cn("flex max-w-[75%] gap-2", isMine && "flex-row-reverse")}>
                {!isMine && (
                  <UserAvatar label={otherUserName} avatarUrl={otherUserAvatarUrl} className="mt-1 h-7 w-7 shrink-0" />
                )}
                <div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    {msg.message}
                  </div>
                  <div className={cn("mt-0.5 flex items-center gap-1 px-1", isMine && "justify-end")}>
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatTime(msg.created_at)}
                    </span>
                    {isMine && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {selfLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="border-t border-border/70 p-3">
        {error && (
          <p className="mb-2 text-xs text-destructive">{t(error as string, { defaultValue: error })}</p>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            disabled={isArchived}
            placeholder={isArchived ? t("archivedPlaceholder") : t("placeholder")}
            className={cn(
              "min-h-[44px] flex-1 resize-none rounded-2xl border border-border/60 bg-muted/50 px-4 py-2.5 text-sm outline-none transition",
              "focus:border-primary/50 focus:ring-1 focus:ring-primary/30",
              isArchived && "opacity-50",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || isArchived}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
