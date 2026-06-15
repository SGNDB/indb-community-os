import {AlertCircle, CheckCircle2} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {LoginForm} from "@/app/[locale]/(auth)/login/login-form";
import {Logo} from "@/components/layout/Logo";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

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
  const success = typeof sp.success === "string" ? sp.success : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex justify-center pt-4">
        <Logo size="md" priority />
      </div>

      {success ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="alert">
          <CheckCircle2 size={18} className="shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold tracking-tight">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm locale={locale} next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
