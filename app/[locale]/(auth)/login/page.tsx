import {getTranslations} from "next-intl/server";

import {LoginForm} from "@/app/[locale]/(auth)/login/login-form";
import {Logo} from "@/components/layout/Logo";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth.login"});
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const phone = typeof sp.phone === "string" ? sp.phone : undefined;
  const registered = sp.registered === "1";

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-8">
      <div className="flex flex-col items-center gap-2 pb-8">
        <Logo size="md" priority />
        <p className="text-center text-base text-muted-foreground">{t("welcome")}</p>
      </div>

      <LoginForm locale={locale} next={next} phone={phone} registered={registered} />
    </div>
  );
}
