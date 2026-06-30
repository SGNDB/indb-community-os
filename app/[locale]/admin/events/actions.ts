"use server";

import {createAdminClient} from "@/lib/supabase/admin";

export type EventLogEntry = {
  id: string;
  event_name: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export async function getAdminEventLogs(limit = 200): Promise<EventLogEntry[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const {data} = await supabase
    .from("event_logs")
    .select("id, event_name, actor_id, entity_type, entity_id, created_at, metadata")
    .order("created_at", {ascending: false})
    .limit(limit);

  return (data ?? []) as unknown as EventLogEntry[];
}
