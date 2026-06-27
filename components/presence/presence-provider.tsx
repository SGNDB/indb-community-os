"use client";

import {createContext, useContext, useEffect, useState, useRef} from "react";
import {createClient} from "@/lib/supabase/client";
import {useCurrentUser} from "@/hooks/use-current-user";
import type {RealtimeChannel} from "@supabase/supabase-js";

interface PresenceContextValue {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextValue>({onlineUsers: new Set()});

export function useIsOnline(userId: string | null | undefined): boolean {
  const {onlineUsers} = useContext(PresenceContext);
  if (!userId) return false;
  return onlineUsers.has(userId);
}

export function useOnlineUsers(): Set<string> {
  const {onlineUsers} = useContext(PresenceContext);
  return onlineUsers;
}

export function PresenceProvider({children}: {children: React.ReactNode}) {
  const {userId} = useCurrentUser();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const settingsChannelRef = useRef<RealtimeChannel | null>(null);
  const showOnlineRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;

    async function init() {
      let showOnline = true;
      try {
        const {data} = await supabase
          .from("user_settings")
          .select("show_online_status")
          .eq("user_id", userId)
          .maybeSingle();
        if (!cancelled) {
          showOnline = data?.show_online_status ?? true;
        }
      } catch {
        // Default to online if query fails (offline, column missing, etc.)
      }
      if (cancelled) return;
      showOnlineRef.current = showOnline;

      const pChannel = supabase.channel("presence-online");
      presenceChannelRef.current = pChannel;

      pChannel
        .on("presence", {event: "sync"}, () => {
          if (cancelled) return;
          const state = pChannel.presenceState();
          const online = new Set<string>();
          for (const presences of Object.values(state)) {
            for (const p of (presences as {user_id?: string}[])) {
              if (p.user_id) online.add(p.user_id);
            }
          }
          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && showOnline && !cancelled) {
            await pChannel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }
        });

      try {
        const sChannel = supabase
          .channel("presence-settings")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_settings",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (cancelled) return;
              const newVal = (payload.new as {show_online_status?: boolean} | null)?.show_online_status ?? true;
              const oldVal = showOnlineRef.current;
              showOnlineRef.current = newVal;
              if (newVal && !oldVal) {
                pChannel.track({user_id: userId, online_at: new Date().toISOString()});
              } else if (!newVal && oldVal) {
                pChannel.untrack();
              }
            },
          )
          .subscribe();

        settingsChannelRef.current = sChannel;
      } catch {
        // postgres_changes subscription is non-critical; presence channel still works
      }
    }

    init();

    return () => {
      cancelled = true;
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      if (settingsChannelRef.current) {
        supabase.removeChannel(settingsChannelRef.current);
        settingsChannelRef.current = null;
      }
    };
  }, [userId]);

  return (
    <PresenceContext.Provider value={{onlineUsers}}>
      {children}
    </PresenceContext.Provider>
  );
}
