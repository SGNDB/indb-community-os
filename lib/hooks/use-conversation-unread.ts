"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadConversationsCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCount(0); return; }
      const { data } = await supabase
        .from("conversation_participants")
        .select("unread_count")
        .eq("user_id", user.id);
      if (!data) { setCount(0); return; }
      setCount(data.reduce((sum, p) => sum + (p.unread_count ?? 0), 0));
    } catch { setCount(0); }
  }, []);

  useEffect(() => {
    refresh();

    const supabase = createClient();

    const channel = supabase
      .channel("unread-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages" },
        refresh,
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return count;
}
