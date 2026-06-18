import {getTranslations} from "next-intl/server";

import {ForgotPasswordForm} from "@/app/[locale]/(auth)/forgot-password/forgot-password-form";
import {Logo} from "@/components/layout/Logo";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth.forgotPassword"});

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Logo size="md" priority />
      </div>
      <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">{t("title")}</h1>
        <ForgotPasswordForm locale={locale} />
      </div>
    </>
  );
}
