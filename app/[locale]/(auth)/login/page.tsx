import {AuthLanguageSwitcher} from "@/components/auth/auth-language-switcher";
import {ThemeToggle} from "@/components/layout/theme-toggle";
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
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const phone = typeof sp.phone === "string" ? sp.phone : undefined;
  const registered = sp.registered === "1";

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Logo size="md" priority />
      </div>
      <div className="flex items-center justify-center gap-2">
        <AuthLanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
        <LoginForm locale={locale} next={next} phone={phone} registered={registered} />
      </div>
    </>
  );
}
