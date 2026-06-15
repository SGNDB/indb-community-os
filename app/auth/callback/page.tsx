"use client";

import {useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";

import {createClient} from "@/lib/supabase/client";
import {routing} from "@/lib/i18n/routing";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const localeParam = searchParams.get("locale");
    const locale = routing.locales.includes(localeParam as typeof routing.locales[number])
      ? localeParam
      : routing.defaultLocale;

    if (!code) {
      router.replace(`/${locale}/login?error=no_code`);
      return;
    }

    (async () => {
      const supabase = createClient();
      const {error} = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/${locale}/login?error=exchange_failed`);
        return;
      }

      const {data: {user}} = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/${locale}/login?error=no_session`);
        return;
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
        const base = (fullName || email.split("@")[0] || "user")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20) || "user";
        const username = `${base}_${Date.now().toString(36)}`;

        await supabase.from("profiles").insert({
          id: user.id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          username,
          onboarding_completed: false,
        });

        router.replace(`/${locale}/onboarding`);
        return;
      }

      if (!profile.onboarding_completed) {
        router.replace(`/${locale}/onboarding`);
        return;
      }

      router.replace(`/${locale}/feed`);
    })();
  }, [router, searchParams]);

  return null;
}