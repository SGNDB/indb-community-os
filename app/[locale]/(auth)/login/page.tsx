import {AlertCircle, CheckCircle2, MailCheck} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {LoginForm} from "@/app/[locale]/(auth)/login/login-form";
import {Logo} from "@/components/layout/Logo";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {resendVerificationAction} from "@/app/[locale]/server-actions";

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
  const emailConfirmation = typeof sp.emailConfirmation === "string" ? sp.emailConfirmation : undefined;
  const confirmation = typeof sp.confirmation === "string" ? sp.confirmation : undefined;
  const success = typeof sp.success === "string" ? sp.success : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const email = typeof sp.email === "string" ? sp.email : undefined;

  const isEmailConfirmation = emailConfirmation === "1"
    || emailConfirmation === "true"
    || confirmation === "1";

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

      {isEmailConfirmation ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <MailCheck size={28} className="text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">{t("emailConfirmation")}</p>
            </div>
            <form action={resendVerificationAction} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="emailConfirmation" value="1" />
              <div>
                {email ? (
                  <input type="hidden" name="email" value={email} />
                ) : (
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                    className="h-11 rounded-xl border-border/60 bg-background px-4 text-sm"
                  />
                )}
              </div>
              <Button type="submit" variant="outline" className="w-full">
                {t("resendVerification")}
              </Button>
            </form>
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="block">
              <Button className="w-full bg-[#ED2124] hover:bg-[#ED2124]/90 text-white">{t("title")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm locale={locale} next={next} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
