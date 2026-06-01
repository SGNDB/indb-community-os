import {createServerClient} from "@supabase/ssr";
import {type NextRequest, NextResponse} from "next/server";

import {getSupabaseEnv} from "@/lib/constants/env";

export async function updateSession(request: NextRequest, response: NextResponse) {
  const env = getSupabaseEnv();
  const responseRef = response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));

        cookiesToSet.forEach(({name, value, options}) => {
          responseRef.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return responseRef;
}


