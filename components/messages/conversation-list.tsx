"use client";

import { useState, useEffect } from "react";
import { Inbox, Search, MessageSquare, Archive } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/routing";
import { UserAvatar } from "@/components/layout/user-avatar";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import type { ConversationListItem } from "@/lib/data/conversations";

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "ar" ? "الآن" : "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
}

function getTypeLabel(type: string, t: (key: string) => string): string {
  if (type === "graatek") return "Gar3tak";
  if (type === "idea") return t("idea");
  return type;
}

interface ConversationListProps {
  initialConversations: ConversationListItem[];
  currentUserId: string;
}

export function ConversationList({ initialConversations, currentUserId }: ConversationListProps) {
  const t = useTranslations("Messages");
  const locale = useLocale();
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArchived, setFilterArchived] = useState(false);

  const filtered = conversations.filter((c) => {
    if (!filterArchived && c.archived_at) return false;
    if (filterArchived && !c.archived_at) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.other_participant?.full_name ?? c.other_participant?.username ?? "").toLowerCase();
    return name.includes(q) || c.title.toLowerCase().includes(q);
  });

  const activeConvId = pathname?.startsWith("/messages/") ? pathname.split("/messages/")[1]?.split("/")[0] : null;

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inbox-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages" },
        async () => {
          const { getMyConversationsAction } = await import("@/app/[locale]/server-actions");
          const res = await getMyConversationsAction();
          if (res.success && res.conversations) {
            setConversations(res.conversations);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_participants", filter: `user_id=eq.${currentUserId}` },
        async () => {
          const { getMyConversationsAction } = await import("@/app/[locale]/server-actions");
          const res = await getMyConversationsAction();
          if (res.success && res.conversations) {
            setConversations(res.conversations);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        async () => {
          const { getMyConversationsAction } = await import("@/app/[locale]/server-actions");
          const res = await getMyConversationsAction();
          if (res.success && res.conversations) {
            setConversations(res.conversations);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Inbox size={20} />
          {t("title")}
        </h2>
        <button
          onClick={() => setFilterArchived((v) => !v)}
          className={cn(
            "rounded-lg p-2 text-muted-foreground hover:bg-muted transition",
            filterArchived && "bg-muted text-foreground",
          )}
          title={filterArchived ? t("showActive") : t("showArchived")}
        >
          <Archive size={18} />
        </button>
      </div>

      <div className="border-b border-border/70 px-3 py-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-lg border border-border/60 bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((conv) => {
              const isActive = activeConvId === conv.id;
              const name = conv.other_participant?.full_name ?? conv.other_participant?.username ?? (conv.title || t("unknown"));
              const avatarUrl = conv.other_participant?.avatar_url ?? null;
              const lastMsg = conv.last_message?.message ?? "";
              const lastTime = conv.last_message?.created_at ?? conv.created_at;

              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50",
                      isActive && "bg-primary/5",
                    )}
                  >
                    <UserAvatar label={name} avatarUrl={avatarUrl} className="mt-0.5 h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{name}</span>
                        {lastTime && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(lastTime, locale)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground/80">
                        {getTypeLabel(conv.type, t)}: {conv.title || t("noTitle")}
                      </span>
                      {lastMsg && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{lastMsg}</p>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {conv.unread_count > 99 ? "99+" : conv.unread_count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
