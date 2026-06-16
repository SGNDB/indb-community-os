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
    <div className="mx-auto flex h-dvh max-w-sm flex-col justify-center overflow-hidden px-5 py-4">
      <div className="flex flex-col items-center gap-1 pb-4">
        <Logo size="md" priority />
      </div>
      <LoginForm locale={locale} next={next} phone={phone} registered={registered} />
    </div>
  );
}
