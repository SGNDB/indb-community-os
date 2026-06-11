import {createClient} from "@supabase/supabase-js";

import {getSupabaseAdminEnv} from "@/lib/constants/env";

export function createAdminClient() {
  const env = getSupabaseAdminEnv();

  if (!env) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
