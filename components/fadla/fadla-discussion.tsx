"use client";

import {AlertCircle, Check, ChevronDown, ChevronUp, Loader2, Send} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";

import {sendFadlaMessageAction} from "@/app/[locale]/server-actions";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {FadlaRequestMessageRow, FadlaRequestMessageWithSender} from "@/types/database";

interface Props {
  requestId: string;
  shareId: string;
  currentUserId: string;
  locale: string;
  initialMessages: FadlaRequestMessageWithSender[];
  status: string;
}

interface DisplayMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  message: string;
  created_at: string;
  pending?: boolean;
}

export function FadlaDiscussion({requestId, shareId, currentUserId, locale, initialMessages, status: initialStatus}: Props) {
  const t = useTranslations("Fadla.discussion");
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender?.full_name ?? m.sender?.username ?? undefined,
      message: m.message,
      created_at: m.created_at,
    })),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialStatus === "completed");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }
  }, [messages]);

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
    const channel = supabase.channel(`fadla-discussion-${requestId}`);

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "fadla_request_messages",
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const newMsg = payload.new as FadlaRequestMessageRow;
        if (newMsg.sender_id !== currentUserId) {
          setMessages((prev) => [...prev, {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            message: newMsg.message,
            created_at: newMsg.created_at,
          }]);
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [requestId, shareId, currentUserId]);

  async function handleSend() {
    if (isCompleted) return;
    const trimmed = input.trim();
    if (!trimmed || sending || trimmed.length > 500) return;
    setSending(true);
    setError(null);

    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {id: optimisticId, sender_id: currentUserId, message: trimmed, created_at: new Date().toISOString(), pending: true},
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
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError(result.error === "rate_limited" ? t("sendError") : result.error);
    }
    setSending(false);
    inputRef.current?.focus();
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

  function renderMessages() {
    return messages.map((msg) => {
      const isMine = msg.sender_id === currentUserId;
      return (
        <div
          key={msg.id}
          className={`flex ${rtl ? (isMine ? "flex-row-reverse" : "") : (isMine ? "flex-row-reverse" : "")}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] ${
              isMine
                ? "items-end"
                : "items-start"
            }`}
          >
            {!isMine && msg.sender_name && (
              <p
                className={`mb-0.5 px-1 text-[11px] font-medium text-muted-foreground ${
                  rtl ? "text-right" : "text-left"
                }`}
                dir={rtl ? "rtl" : "ltr"}
              >
                {msg.sender_name}
              </p>
            )}
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                isMine
                  ? "bg-[#ED2124] text-white rounded-br-md"
                  : "bg-card text-foreground border border-border/60 rounded-bl-md"
              } ${msg.pending ? "opacity-60" : ""}`}
              dir={rtl ? "rtl" : "ltr"}
            >
              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              <div className={`mt-1 flex items-center gap-1 ${rtl ? "flex-row-reverse" : ""}`}>
                <span className={`text-[10px] ${isMine ? "text-white/70" : "text-muted-foreground"}`}>
                  {msg.pending ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    formatTime(msg.created_at)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      <div
        ref={containerRef}
        className={`mb-3 flex flex-col gap-2 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 ${
          isCompleted && !showHistory ? "max-h-0 min-h-0 overflow-hidden border-0 mb-0" : "p-3 max-h-80 min-h-[120px]"
        }`}
        dir={rtl ? "rtl" : "ltr"}
      >
        {isCompleted && !showHistory ? null : messages.length === 0 && !isCompleted ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          renderMessages()
        )}
        <div ref={bottomRef} />
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

      {!isCompleted && (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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

      {isCompleted && showHistory && messages.length > 0 && (
        <div
          ref={containerRef}
          className="mb-3 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-3"
          dir={rtl ? "rtl" : "ltr"}
        >
          {renderMessages()}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
