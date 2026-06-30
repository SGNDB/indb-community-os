import {createClient} from "@/lib/supabase/client";
import {createClient as createServerClient} from "@/lib/supabase/server";

export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createServerClient();
  const {data} = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from("settings").upsert({key, value});
}

export async function getPluginSettings(pluginId: string): Promise<Record<string, string>> {
  const supabase = await createServerClient();
  const {data} = await supabase
    .from("plugin_settings")
    .select("key, value")
    .eq("plugin_id", pluginId);
  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setPluginSetting(pluginId: string, key: string, value: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from("plugin_settings").upsert({plugin_id: pluginId, key, value});
}
