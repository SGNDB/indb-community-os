"use server";

import {createAdminClient} from "@/lib/supabase/admin";
import {setPluginState} from "@/core/plugins/registry";
import {revalidatePath} from "next/cache";

export async function togglePlugin(pluginId: string, enabled: boolean) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client not available");
  const state = enabled ? "enabled" : "disabled";

  const {error} = await supabase
    .from("plugin_settings")
    .upsert(
      {plugin_id: pluginId, key: "state", value: state},
      {onConflict: "plugin_id, key"},
    );

  if (error) throw new Error(`Failed to update plugin state: ${error.message}`);

  setPluginState(pluginId as Parameters<typeof setPluginState>[0], state as "enabled" | "disabled");

  revalidatePath("/admin/plugins");
}

export async function getPluginStates(): Promise<Record<string, string>> {
  const supabase = createAdminClient();
  if (!supabase) return {};
  const {data} = await supabase
    .from("plugin_settings")
    .select("plugin_id, value")
    .eq("key", "state");

  const states: Record<string, string> = {};
  for (const row of data ?? []) {
    states[row.plugin_id] = row.value;
  }
  return states;
}
