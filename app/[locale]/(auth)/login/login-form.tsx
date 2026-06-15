"use client";

import {Eye, EyeOff, Loader2, AlertCircle} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/client";
import {loginAction} from "@/app/[locale]/server-actions";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm({locale, next}: {locale: string; next?: string}) {
  const t = useTranslations("Auth.login");
  const errorT = useTranslations("Auth.errors");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({email: "", password: ""});

  function updateField(field: "email" | "password", value: string) {
    setFormData((current) => ({...current, [field]: value}));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = {...current};
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    const email = formData.email.trim();

    if (!email) {
      nextErrors.email = errorT("email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = errorT("auth_invalid_email");
    }

    if (!formData.password) {
      nextErrors.password = errorT("password_required");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("locale", locale);
      formDataObj.append("email", formData.email);
      formDataObj.append("password", formData.password);
      if (next) formDataObj.append("next", next);

      const result = await loginAction(formDataObj);
      
      if (result?.error) {
        setErrors(result.error);
      } else if (result?.success) {
        router.push(result.redirect || "/feed");
        router.refresh();
      }
    } catch {
      setErrors({general: errorT("auth_generic_error")});
    } finally {
      setIsLoading(false);
    }
  };

  async function handleFacebookLogin() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?locale=${locale}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({provider: "facebook", options: {scopes: "public_profile,email", redirectTo}});
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">{t("email")}</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="name@example.com"
          aria-invalid={Boolean(errors.email)}
          className={`h-11 rounded-xl bg-background px-4 text-sm transition-colors focus-visible:ring-[#ED2124]/20 ${
            errors.email
              ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
              : "border-border/60 focus-visible:border-[#ED2124]"
          }`}
          autoComplete="email"
        />
        {errors.email && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.email}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">{t("password")}</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            className={`h-11 rounded-xl bg-background pe-12 ps-4 text-sm transition-colors focus-visible:ring-[#ED2124]/20 ${
              errors.password
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-border/60 focus-visible:border-[#ED2124]"
            }`}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 end-2 my-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#ED2124]/35"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.password}
          </p>
        )}
      </div>
      {errors.general && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{errors.general}</span>
        </div>
      )}
      <div className="flex items-center justify-end">
        <Link href="/forgot-password" className="text-xs text-[#ED2124] hover:underline">{t("forgotPassword")}</Link>
      </div>
      <Button type="submit" className="w-full bg-[#ED2124] hover:bg-[#ED2124]/90 text-white" disabled={isLoading}>
        {isLoading ? <><Loader2 size={16} className="mr-2 inline animate-spin" />{t("submitting")}</> : t("submit")}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFacebookLogin}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        {t("loginWithFacebook")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-[#ED2124] hover:underline">{t("register")}</Link>
      </p>
    </form>
  );
}
