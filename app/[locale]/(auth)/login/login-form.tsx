"use client";

import {Eye, EyeOff, Loader2, AlertCircle, CheckCircle2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {loginAction} from "@/app/[locale]/server-actions";

interface FormErrors {
  phone?: string;
  password?: string;
  general?: string;
}

export function LoginForm({locale, next, phone: prefilledPhone, registered}: {locale: string; next?: string; phone?: string; registered?: boolean}) {
  const t = useTranslations("Auth.login");
  const errorT = useTranslations("Auth.errors");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({phone: prefilledPhone?.replace(/\D/g, "") ?? "", password: ""});

  function updateField(field: "phone" | "password", value: string) {
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

    if (!formData.phone.trim()) {
      nextErrors.phone = errorT("phone_required");
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
      formDataObj.append("phone", formData.phone);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {registered && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 size={16} className="shrink-0 text-green-600" />
          <span>{t("registeredSuccess")}</span>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">{t("phone")}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            +222
          </span>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="XX XX XX XX"
            aria-invalid={Boolean(errors.phone)}
            className={`h-11 rounded-xl bg-background pl-12 pe-4 text-sm transition-colors focus-visible:ring-[#ED2124]/20 ${
              errors.phone
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                : "border-border/60 focus-visible:border-[#ED2124]"
            }`}
            autoComplete="tel-national"
            inputMode="numeric"
          />
        </div>
        {errors.phone && (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} />
            {errors.phone}
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
      <Button type="submit" className="w-full bg-[#ED2124] hover:bg-[#ED2124]/90 text-white" disabled={isLoading}>
        {isLoading ? <><Loader2 size={16} className="mr-2 inline animate-spin" />{t("submitting")}</> : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-medium text-[#ED2124] hover:underline">{t("register")}</Link>
      </p>
    </form>
  );
}
