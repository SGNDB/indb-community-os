import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

import {getSupabaseEnv} from "@/lib/constants/env";

export async function createClient() {
  const env = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value, options}) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore when called from a Server Component without mutable cookies.
          }
        });
      },
    },
  });
}


