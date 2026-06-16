import {getTranslations} from "next-intl/server";

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
  const t = await getTranslations({locale, namespace: "Auth.register"});
  const {next} = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-8">
      <div className="flex flex-col items-center gap-2 pb-8">
        <Logo size="md" priority />
        <p className="text-center text-base text-muted-foreground">{t("welcome")}</p>
      </div>

      <RegisterForm locale={locale} next={next} />
    </div>
  );
}
