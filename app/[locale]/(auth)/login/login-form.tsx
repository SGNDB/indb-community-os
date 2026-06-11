"use client";

import {Eye, EyeOff} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {loginAction} from "@/app/[locale]/server-actions";

function SubmitButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? loading : label}
    </Button>
  );
}

export function LoginForm({locale, next}: {locale: string; next?: string}) {
  const t = useTranslations("Auth.login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={loginAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input type="email" name="email" placeholder={t("email")} required />
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder={t("password")}
          required
          className="pe-12"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 end-2 my-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
          aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <SubmitButton label={t("submit")} loading={t("submitting")} />
        <Link href="/forgot-password" className="text-xs text-primary hover:underline">{t("forgotPassword")}</Link>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {t("noAccount")} <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-primary hover:underline">{t("register")}</Link>
      </p>
    </form>
  );
}
