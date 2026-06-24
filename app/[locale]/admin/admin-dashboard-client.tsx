"use client";

import {useEffect, useState, useRef} from "react";
import {createClient} from "@/lib/supabase/client";
import {Users, Lightbulb, Gift, Landmark} from "lucide-react";

interface ActivityEvent {
  id: string;
  type: string;
  label: string;
  title: string;
  time: string;
}

const eventIcons: Record<string, typeof Users> = {
  "New User": Users,
  "New Idea": Lightbulb,
  "New Graatek": Gift,
  Donation: Landmark,
};

const eventColors: Record<string, string> = {
  "New User": "text-primary bg-primary/10",
  "New Idea": "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20",
  "New Graatek": "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20",
  Donation: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
};

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
            {
              id: `${table}-${newRow.id}-${Date.now()}`,
              type: label,
              label,
              title: String(title).slice(0, 80),
              time: new Date().toLocaleTimeString(),
            },
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
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live Activity
        </p>
        <span className="text-xs text-muted-foreground/60">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {events.slice(0, 8).map((event) => {
          const Icon = eventIcons[event.type] ?? Users;
          const colorClass = eventColors[event.type] ?? "text-muted-foreground bg-muted";
          return (
            <div
              key={event.id}
              className="admin-activity-enter flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 p-3 transition hover:bg-muted/40"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.label}</p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                {event.time}
              </span>
            </div>
          );
        })}
      </div>

      {events.length > 8 && (
        <p className="mt-3 text-center text-xs text-muted-foreground/60">
          +{events.length - 8} more events
        </p>
      )}
    </div>
  );
}
