import {createBrowserClient} from "@supabase/ssr";

import {getSupabaseEnv} from "@/lib/constants/env";

export function createClient() {
  const env = getSupabaseEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}


