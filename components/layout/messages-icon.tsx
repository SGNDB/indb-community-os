"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useUnreadConversationsCount } from "@/lib/hooks/use-conversation-unread";

export function MessagesIcon() {
  const unreadCount = useUnreadConversationsCount();

  return (
    <Link
      href="/messages"
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
      style={{ touchAction: "manipulation" }}
    >
      <MessageSquare size={20} />
      {unreadCount > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
