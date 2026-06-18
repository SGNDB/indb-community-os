import {AuthLanguageSwitcher} from "@/components/auth/auth-language-switcher";
import {ThemeToggle} from "@/components/layout/theme-toggle";
import {RegisterForm} from "@/app/[locale]/(auth)/register/register-form";
import {Logo} from "@/components/layout/Logo";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{next?: string}>;
}) {
  const {locale} = await params;
  const {next} = await searchParams;

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
        <RegisterForm locale={locale} next={next} />
      </div>
    </>
  );
}
