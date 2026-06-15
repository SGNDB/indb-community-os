import {createBrowserClient} from "@supabase/ssr";

import {getSupabaseEnv} from "@/lib/constants/env";

export function createClient() {
  const env = getSupabaseEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        const parsed: Record<string, string> = {};
        document.cookie.split("; ").forEach((c) => {
          const [key, ...rest] = c.split("=");
          if (key) parsed[key.trim()] = rest.join("=");
        });
        return Object.entries(parsed).map(([name, value]) => ({name, value}));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value, options}) => {
          document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge ?? 31536000}; samesite=lax; secure`;
        });
      },
    },
  });
}


