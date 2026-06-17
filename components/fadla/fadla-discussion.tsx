"use client";

import {AlertCircle, Check, ChevronDown, ChevronUp, Loader2, Send} from "lucide-react";
import {useTranslations} from "next-intl";
import {useCallback, useEffect, useRef, useState} from "react";
import type {RealtimeChannel} from "@supabase/supabase-js";

import {sendFadlaMessageAction} from "@/app/[locale]/server-actions";
import {UserAvatar} from "@/components/layout/user-avatar";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {FadlaRequestMessageRow, FadlaRequestMessageWithSender} from "@/types/database";

interface Props {
  requestId: string;
  shareId: string;
  currentUserId: string;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  conversationWithName?: string | null;
  conversationWithAvatarUrl?: string | null;
  locale: string;
  initialMessages: FadlaRequestMessageWithSender[];
  status: string;
}

interface DisplayMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar_url?: string | null;
  message: string;
  created_at: string;
  pending?: boolean;
}

interface FadlaMessageBroadcastPayload {
  id?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar_url?: string | null;
  message?: string;
  created_at?: string;
}

interface SenderIdentity {
  name: string;
  avatarUrl: string | null;
}

export function FadlaDiscussion({
  requestId,
  shareId,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  conversationWithName,
  conversationWithAvatarUrl,
  locale,
  initialMessages,
  status: initialStatus,
}: Props) {
  const t = useTranslations("Fadla.discussion");
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender?.full_name ?? m.sender?.username ?? undefined,
      sender_avatar_url: m.sender?.avatar_url ?? null,
      message: m.message,
      created_at: m.created_at,
    })),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialStatus === "completed");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserTypingName, setOtherUserTypingName] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelReadyRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingBroadcastRef = useRef(0);
  const senderIdentityCacheRef = useRef<Map<string, SenderIdentity>>(new Map());

  function scrollMessagesToBottom(behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTo({top: container.scrollHeight, behavior});
    });
  }

  useEffect(() => {
    if (isNearBottomRef.current && !isCompleted) {
      scrollMessagesToBottom();
    }
  }, [messages, isCompleted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const threshold = 100;
      isNearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsCompleted(initialStatus === "completed");
  }, [initialStatus]);

  useEffect(() => {
    if (!isCompleted) return;
    isNearBottomRef.current = true;
  }, [isCompleted]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`fadla-discussion-${requestId}`, {
      config: {
        broadcast: {self: false},
      },
    });
    channelRef.current = channel;
    channelReadyRef.current = false;

    async function getSenderIdentity(senderId: string) {
      const cached = senderIdentityCacheRef.current.get(senderId);
      if (cached) return cached;

      const {data} = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", senderId)
        .maybeSingle();

      const identity = {
        name: data?.full_name ?? data?.username ?? "",
        avatarUrl: data?.avatar_url ?? null,
      };
      if (identity.name || identity.avatarUrl) senderIdentityCacheRef.current.set(senderId, identity);
      return identity;
    }

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "fadla_request_messages",
        filter: `request_id=eq.${requestId}`,
      }, async (payload) => {
        const newMsg = payload.new as FadlaRequestMessageRow;
        if (newMsg.sender_id !== currentUserId) {
          const senderIdentity = await getSenderIdentity(newMsg.sender_id);
          isNearBottomRef.current = true;
          setMessages((prev) =>
            prev.some((msg) => msg.id === newMsg.id)
              ? prev
              : [...prev, {
                  id: newMsg.id,
                  sender_id: newMsg.sender_id,
                  sender_name: senderIdentity.name || undefined,
                  sender_avatar_url: senderIdentity.avatarUrl,
                  message: newMsg.message,
                  created_at: newMsg.created_at,
                }],
          );
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "community_shares",
        filter: `id=eq.${shareId}`,
      }, (payload) => {
        const updated = payload.new as {status?: string};
        if (updated.status === "completed") {
          setIsCompleted(true);
        }
      })
      .on("broadcast", {event: "message"}, (payload) => {
        const eventPayload = payload as {payload?: FadlaMessageBroadcastPayload} & FadlaMessageBroadcastPayload;
        const messagePayload = eventPayload.payload ?? eventPayload;
        if (
          !messagePayload.id ||
          !messagePayload.sender_id ||
          !messagePayload.message ||
          !messagePayload.created_at ||
          messagePayload.sender_id === currentUserId
        ) {
          return;
        }

        setOtherUserTyping(false);
        setOtherUserTypingName(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        isNearBottomRef.current = true;
        setMessages((prev) =>
          prev.some((msg) => msg.id === messagePayload.id)
            ? prev
            : [...prev, {
                id: messagePayload.id!,
                sender_id: messagePayload.sender_id!,
                sender_name: messagePayload.sender_name || undefined,
                sender_avatar_url: messagePayload.sender_avatar_url ?? null,
                message: messagePayload.message!,
                created_at: messagePayload.created_at!,
              }],
        );
      })
      .on("broadcast", {event: "typing"}, (payload) => {
        const eventPayload = payload as {payload?: {sender_id?: string; sender_name?: string}; sender_id?: string; sender_name?: string};
        const senderId = eventPayload.payload?.sender_id ?? eventPayload.sender_id;
        const senderName = eventPayload.payload?.sender_name ?? eventPayload.sender_name ?? null;
        if (senderId && senderId !== currentUserId) {
          setOtherUserTyping(true);
          setOtherUserTypingName(senderName);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
            setOtherUserTypingName(null);
          }, 2500);
        }
      })
      .subscribe((status) => {
        channelReadyRef.current = status === "SUBSCRIBED";
      });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      channelReadyRef.current = false;
    };
  }, [requestId, shareId, currentUserId]);

  async function handleSend() {
    if (isCompleted) return;
    const trimmed = input.trim();
    if (!trimmed || sending || trimmed.length > 500) return;
    setSending(true);
    setError(null);

    const optimisticId = `opt-${Date.now()}`;
    isNearBottomRef.current = true;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        sender_id: currentUserId,
        sender_name: currentUserName ?? undefined,
        sender_avatar_url: currentUserAvatarUrl ?? null,
        message: trimmed,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);
    setInput("");

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("shareId", shareId);
    formData.set("requestId", requestId);
    formData.set("message", trimmed);

    const result = await sendFadlaMessageAction(formData);

    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? {...m, id: result.message.id, created_at: result.message.created_at, pending: false} : m)),
      );
      if (channelReadyRef.current) {
        void channelRef.current?.send({
          type: "broadcast",
          event: "message",
          payload: {
            id: result.message.id,
            sender_id: currentUserId,
            sender_name: currentUserName?.trim() || undefined,
            sender_avatar_url: currentUserAvatarUrl ?? null,
            message: trimmed,
            created_at: result.message.created_at,
          },
        });
      }
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError(result.error === "rate_limited" ? t("sendError") : result.error);
    }
    setSending(false);
    inputRef.current?.focus({preventScroll: true});
  }

  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (channelReadyRef.current && now - lastTypingBroadcastRef.current > 1500) {
      lastTypingBroadcastRef.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: {
          sender_id: currentUserId,
          sender_name: currentUserName?.trim() || undefined,
        },
      });
    }
  }, [currentUserId, currentUserName]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (!isCompleted && e.target.value) {
      broadcastTyping();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const rtl = locale === "ar";
  const youLabel = rtl ? "\u0623\u0646\u062a" : "You";
  const fallbackSenderName = rtl ? "\u0634\u062e\u0635 \u0645\u0627" : "Someone";
  const conversationLabel = rtl ? "\u0623\u0646\u062a \u062a\u062a\u062d\u062f\u062b \u0645\u0639:" : "You are talking with:";
  const firstReceivedMessage = messages.find((msg) => msg.sender_id !== currentUserId);
  const activeConversationName = conversationWithName?.trim() || firstReceivedMessage?.sender_name || fallbackSenderName;
  const activeConversationAvatarUrl = conversationWithAvatarUrl ?? firstReceivedMessage?.sender_avatar_url ?? null;

  function renderMessages() {
    return messages.map((msg) => {
      const isMine = msg.sender_id === currentUserId;
      const senderName = isMine ? youLabel : msg.sender_name?.trim() || fallbackSenderName;
      const sentAt = formatTime(msg.created_at);
      return (
        <div
          key={msg.id}
          className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
          dir="ltr"
        >
          <div
            className={`flex max-w-[86%] gap-2 sm:max-w-[76%] ${
              isMine ? "justify-end" : "justify-start"
            }`}
          >
            {!isMine && (
              <UserAvatar
                label={senderName}
                avatarUrl={msg.sender_avatar_url}
                className="mt-5 size-9 shrink-0 text-[10px]"
              />
            )}
            <div className={`flex min-w-0 flex-col ${isMine ? "items-end" : "items-start"}`}>
              {!isMine && (
                <div className="mb-1 flex max-w-full items-center gap-2 px-1 text-[11px] leading-none text-muted-foreground">
                  <span className="truncate font-semibold text-foreground" dir="auto">{senderName}</span>
                  <span className="shrink-0">{sentAt}</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isMine
                    ? "rounded-br-md bg-[#ED2124] text-white"
                    : "rounded-bl-md border border-border/60 bg-[#f4f5f7] text-slate-900 dark:bg-muted dark:text-foreground"
                } ${msg.pending ? "opacity-70" : ""}`}
                dir={rtl ? "rtl" : "ltr"}
              >
                {isMine && (
                  <div className="mb-1 flex items-center justify-end gap-2 text-[11px] leading-none text-white/80">
                    <span className="font-semibold text-white">{youLabel}</span>
                    <span className="shrink-0">
                      {msg.pending ? <Loader2 size={10} className="animate-spin" /> : sentAt}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                {!isMine && (
                  <span className="sr-only">
                    {senderName} {sentAt}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  function renderConversationHeader() {
    return (
      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5" dir={rtl ? "rtl" : "ltr"}>
        <UserAvatar
          label={activeConversationName}
          avatarUrl={activeConversationAvatarUrl}
          className="size-9 shrink-0 text-[10px]"
        />
        <div className="min-w-0">
          <p className="text-[11px] leading-tight text-muted-foreground">{conversationLabel}</p>
          <p className="truncate text-sm font-semibold text-foreground" dir="auto">{activeConversationName}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderConversationHeader()}

      {/* Messages container - always collapsed when completed (history shown in separate block) */}
      <div
        ref={containerRef}
        className={`mb-3 flex flex-col gap-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 ${
          isCompleted ? "max-h-0 min-h-0 overflow-hidden border-0 mb-0" : "p-3.5 max-h-80 min-h-[140px]"
        }`}
        dir="ltr"
      >
        {!isCompleted && messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground" dir={rtl ? "rtl" : "ltr"}>{t("empty")}</p>
        ) : !isCompleted ? (
          renderMessages()
        ) : null}
      </div>
      {isCompleted && (
        <div className="mb-3 rounded-2xl border border-green-200 bg-green-50/70 p-4 text-center dark:border-green-900/50 dark:bg-green-950/20">
          <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
            <Check size={18} />
            <span className="font-semibold">{t("completedTitle")}</span>
          </div>
          <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/80">
            {t("completedSubtitle")}
          </p>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-green-300/50 px-4 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 dark:border-green-700/50 dark:text-green-300 dark:hover:bg-green-900/30"
            >
              {showHistory ? (
                <><ChevronUp size={14} />{t("hideHistory")}</>
              ) : (
                <><ChevronDown size={14} />{t("viewHistory")}</>
              )}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={12} />
          {error}
        </p>
      )}

      {otherUserTyping && !isCompleted && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground" dir={rtl ? "rtl" : "ltr"}>
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{animationDelay: "0ms"}} />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{animationDelay: "200ms"}} />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{animationDelay: "400ms"}} />
          </span>
          <span>
            {otherUserTypingName
              ? rtl
                ? `${otherUserTypingName} \u064a\u0643\u062a\u0628...`
                : `${otherUserTypingName} typing...`
              : rtl
                ? "\u064a\u0643\u062a\u0628..."
                : "typing..."}
          </span>
        </div>
      )}

      {!isCompleted && (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={1}
            maxLength={500}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-[15px] outline-none transition focus:border-[#ED2124]/50 focus:ring-1 focus:ring-[#ED2124]/20"
            dir={rtl ? "rtl" : "ltr"}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending || input.trim().length > 500}
            className="mb-px flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#ED2124] p-0 hover:bg-[#ED2124]/90 disabled:opacity-50"
            aria-label={t("send")}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="text-white" />}
          </Button>
        </div>
      )}

      {!isCompleted && input.length > 450 && (
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {input.length}/500
        </p>
      )}

      {/* History shown below the completion banner when user expands it */}
      {isCompleted && showHistory && messages.length > 0 && (
        <div
          className="mb-3 flex max-h-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-3.5"
          dir="ltr"
        >
          {renderMessages()}
        </div>
      )}
    </div>
  );
}
