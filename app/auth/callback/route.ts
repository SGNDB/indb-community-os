import {createServerClient} from "@supabase/ssr";
import {NextRequest, NextResponse} from "next/server";

import {getSupabaseEnv} from "@/lib/constants/env";
import {routing} from "@/lib/i18n/routing";

export async function GET(request: NextRequest) {
  const {searchParams, origin} = new URL(request.url);
  const code = searchParams.get("code");
  const localeParam = searchParams.get("locale");
  const locale = routing.locales.includes(localeParam as (typeof routing.locales)[number])
    ? localeParam
    : routing.defaultLocale;
  const next = searchParams.get("next") ?? "";

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, origin));
  }

  const env = getSupabaseEnv();
  const redirectResponse = NextResponse.redirect(new URL(`/${locale}/feed`, origin));

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
        cookiesToSet.forEach(({name, value, options}) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {error} = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, origin));
  }

  const {data: {user}} = await supabase.auth.getUser();

  if (user) {
    const {data: profile} = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, origin));
    }

    const safeNext = next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/feed";
    return NextResponse.redirect(new URL(`/${locale}${safeNext}`, origin));
  }

  return NextResponse.redirect(new URL(`/${locale}/feed`, origin));
}
