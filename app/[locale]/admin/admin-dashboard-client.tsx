"use client";

import {useEffect, useState, useRef} from "react";
import {createClient} from "@/lib/supabase/client";
import {REALTIME_LISTEN_TYPES} from "@supabase/supabase-js";

interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  time: string;
}

export function AdminDashboardClient() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const channelsRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]>[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];
    channelsRef.current = channels;

    function watchTable(table: string, label: string, titleField = "title") {
      const channelName = `admin-live-${table}-${Math.random().toString(36).slice(2, 8)}`;
      const channel = supabase.channel(channelName);
      channel.on(
        "postgres_changes" as never,
        {event: "INSERT", schema: "public", table},
        (payload: {new: Record<string, unknown>}) => {
          const newRow = payload.new;
          const title =
            (newRow[titleField] as string) ||
            (newRow.full_name as string) ||
            (newRow.username as string) ||
            `New ${label}`;
          setEvents((prev) => [
            {id: `${table}-${newRow.id}-${Date.now()}`, type: label, title, time: new Date().toLocaleTimeString()},
            ...prev.slice(0, 19),
          ]);
        },
      );
      channel.subscribe();
      channels.push(channel);
    }

    watchTable("profiles", "New User", "full_name");
    watchTable("ideas", "New Idea");
    watchTable("community_shares", "New Graatek");
    watchTable("support_contributions", "Donation", "amount");

    return () => {
      for (const ch of channels) supabase.removeChannel(ch);
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_16px_rgba(7,31,54,0.06)]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <h2 className="text-sm font-semibold text-muted-foreground">Live Activity</h2>
      </div>
      <div className="mt-3 space-y-1">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted/50">
            <span className="text-xs text-muted-foreground/60 tabular-nums">{event.time}</span>
            <span className="font-medium text-foreground">{event.title}</span>
            <span className="text-xs text-muted-foreground">{event.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
