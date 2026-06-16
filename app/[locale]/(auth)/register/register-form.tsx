"use client";

import {Eye, EyeOff, Loader2, AlertCircle, LogIn} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {useRouter} from "next/navigation";

import {AuthLanguageSwitcher} from "@/components/auth/auth-language-switcher";
import {ThemeToggle} from "@/components/layout/theme-toggle";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/lib/i18n/routing";
import {registerAction} from "@/app/[locale]/server-actions";
import {normalizePhone} from "@/lib/auth/phone";

interface FormErrors {
  fullName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const PHONE_PLACEHOLDER: Record<string, string> = {
  ar: "رقم الهاتف",
  fr: "Numéro de téléphone",
  en: "Phone number",
};

export function RegisterForm({locale, next}: {locale: string; next?: string}) {
  const t = useTranslations("Auth.register");
  const v = useTranslations("Auth.validation");
  const errorT = useTranslations("Auth.errors");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const phonePlaceholder = PHONE_PLACEHOLDER[locale] ?? "Phone number";

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({...current, [field]: value}));
    setErrors((current) => {
      const nextErrors = {...current};
      delete nextErrors[field];
      if (field === "password" || field === "confirmPassword") {
        delete nextErrors.confirmPassword;
      }
      if (Object.keys(nextErrors).length === Object.keys(current).length) return current;
      return nextErrors;
    });
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = errorT("full_name_required");
    if (!formData.phone.trim()) nextErrors.phone = errorT("phone_required");
    if (!formData.password) nextErrors.password = errorT("password_required");
    else if (formData.password.length < 8 || formData.password.length > 50) nextErrors.password = errorT("password_length");
    if (!formData.confirmPassword) nextErrors.confirmPassword = errorT("confirm_password_required");
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = errorT("password_mismatch");

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
      formDataObj.append("fullName", formData.fullName);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("password", formData.password);
      formDataObj.append("confirmPassword", formData.confirmPassword);
      if (next) formDataObj.append("next", next);

      const result = await registerAction(formDataObj);

      if (result && "error" in result) {
        setErrors(result.error ?? {});
      } else if (result?.success) {
        router.push(result.redirect || "/onboarding");
        router.refresh();
      }
    } catch {
      setErrors({general: errorT("auth_generic_error")});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex items-center justify-center gap-2">
        <AuthLanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="space-y-2">
        <Input
          name="fullName"
          value={formData.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          placeholder={t("fullNamePlaceholder")}
          aria-invalid={Boolean(errors.fullName)}
          className={`h-12 w-full rounded-2xl border bg-background px-4 text-[15px] transition focus-visible:ring-2 focus-visible:ring-[#ED2124]/25 ${
            errors.fullName
              ? "border-red-400 focus-visible:border-red-400"
              : "border-border/60 focus-visible:border-[#ED2124]"
          }`}
          autoComplete="name"
        />
        {errors.fullName && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground pointer-events-none select-none">
            +222
          </span>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder={phonePlaceholder}
            aria-invalid={Boolean(errors.phone)}
            className={`h-12 w-full rounded-2xl border bg-background pl-16 pr-4 text-[15px] transition focus-visible:ring-2 focus-visible:ring-[#ED2124]/25 ${
              errors.phone
                ? "border-red-400 focus-visible:border-red-400"
                : "border-border/60 focus-visible:border-[#ED2124]"
            }`}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        {errors.phone && errors.phone !== "auth_phone_exists" && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            {errors.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            className={`h-12 w-full rounded-2xl border bg-background px-4 pr-12 text-[15px] transition focus-visible:ring-2 focus-visible:ring-[#ED2124]/25 ${
              errors.password
                ? "border-red-400 focus-visible:border-red-400"
                : "border-border/60 focus-visible:border-[#ED2124]"
            }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 end-2 my-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted active:bg-muted/70"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {formData.password.length > 0 && formData.password.length < 8 && (
          <p className="text-[13px] text-muted-foreground pt-1">{v("password_length")}</p>
        )}
        {errors.password && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            {errors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.confirmPassword)}
            className={`h-12 w-full rounded-2xl border bg-background px-4 pr-12 text-[15px] transition focus-visible:ring-2 focus-visible:ring-[#ED2124]/25 ${
              errors.confirmPassword
                ? "border-red-400 focus-visible:border-red-400"
                : "border-border/60 focus-visible:border-[#ED2124]"
            }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute inset-y-0 end-2 my-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted active:bg-muted/70"
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {errors.phone === "auth_phone_exists" ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
          <p className="font-medium">{errorT("phone_exists_title")}</p>
          <Link
            href={`/login?phone=${normalizePhone(formData.phone).replace(/\D/g, "").slice(3)}`}
            className="mt-2 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800 hover:underline"
          >
            <LogIn size={16} />
            {errorT("phone_exists_login")}
          </Link>
        </div>
      ) : errors.general && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-[#ED2124] text-[16px] font-semibold hover:bg-[#ED2124]/90 active:bg-[#ED2124]/80 disabled:opacity-60"
        disabled={isLoading}
        style={{touchAction: "manipulation"}}
      >
        {isLoading ? (
          <><Loader2 size={20} className="mr-2 inline animate-spin" />{t("submitting")}</>
        ) : (
          t("submit")
        )}
      </Button>

      <p className="text-center text-[15px] text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-[#ED2124] hover:underline"
        >
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
