"use client";

import {Eye, EyeOff} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {registerAction} from "@/app/[locale]/server-actions";

function SubmitButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? loading : label}
    </Button>
  );
}

export function RegisterForm({locale, next}: {locale: string; next?: string}) {
  const t = useTranslations("Auth.register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={registerAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input name="username" placeholder={t("username")} required />
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
      <div className="relative">
        <Input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder={t("confirmPassword")}
          required
          className="pe-12"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((current) => !current)}
          className="absolute inset-y-0 end-2 my-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/35"
          aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
          aria-pressed={showConfirmPassword}
        >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <SubmitButton label={t("submit")} loading={t("submitting")} />
      <p className="text-center text-xs text-muted-foreground">
        {t("hasAccount")} <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary hover:underline">{t("login")}</Link>
      </p>
    </form>
  );
}
