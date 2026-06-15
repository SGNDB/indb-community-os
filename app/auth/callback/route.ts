import {createServerClient} from "@supabase/ssr";
import {NextRequest, NextResponse} from "next/server";

import {getSupabaseEnv} from "@/lib/constants/env";
import {routing} from "@/lib/i18n/routing";

async function generateUsername(supabase: ReturnType<typeof createServerClient>, fullName: string, email: string): Promise<string> {
  const base = (fullName || email.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = attempt === 0 ? "" : `_${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${base}${suffix}`;
    const {data: existing} = await supabase
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!existing) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`;
}

export async function GET(request: NextRequest) {
  const {searchParams, origin} = new URL(request.url);
  const code = searchParams.get("code");
  const localeParam = searchParams.get("locale");
  const locale = routing.locales.includes(localeParam as (typeof routing.locales)[number])
    ? localeParam
    : routing.defaultLocale;

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, origin));
  }

  const env = getSupabaseEnv();
  const redirectResponse = NextResponse.redirect(new URL(`/${locale}/feed`, origin));

  // In-memory cookie store so setAll updates are visible to subsequent getAll calls
  const cookieStore = new Map<string, string>();
  request.cookies.getAll().forEach(c => cookieStore.set(c.name, c.value));

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieStore.entries()).map(([name, value]) => ({name, value}));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value, options}) => {
          if (!value) {
            cookieStore.delete(name);
          } else {
            cookieStore.set(name, value);
          }
          redirectResponse.cookies.set(name, value, options || {});
        });
      },
    },
  });

  const {error} = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=exchange_failed`, origin));
  }

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=no_session`, origin));
  }

  const {data: profile} = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const email = user.email || "";
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    const username = await generateUsername(supabase, fullName, email);

    await supabase.from("profiles").insert({
      id: user.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      username,
      onboarding_completed: false,
    });

    return NextResponse.redirect(new URL(`/${locale}/onboarding`, origin));
  }

  if (!profile.onboarding_completed) {
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, origin));
  }

  return NextResponse.redirect(new URL(`/${locale}/feed`, origin));
}
