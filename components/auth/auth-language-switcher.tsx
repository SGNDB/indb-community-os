"use client";

import {useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";

import {usePathname, useRouter} from "@/lib/i18n/routing";

const AUTH_LOCALES = ["ar", "fr", "en"] as const;
const LOCALE_LABELS: Record<string, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

export function AuthLanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLanguage(nextLocale: (typeof AUTH_LOCALES)[number]) {
    if (nextLocale === locale) return;

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem("preferred-locale", nextLocale);
    } catch {}

    void fetch("/api/locale", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({locale: nextLocale}),
    });

    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <div className="flex items-center justify-center" aria-label={t("label")}>
      {AUTH_LOCALES.map((item, idx) => (
        <span key={item} className="inline-flex items-center">
          {idx > 0 && (
            <span className="mx-1.5 text-sm text-muted-foreground/40">|</span>
          )}
          <button
            type="button"
            onClick={() => changeLanguage(item)}
            disabled={isPending}
            className={`min-h-9 rounded-lg px-3 py-1 text-sm font-medium transition ${
              item === locale
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground active:text-foreground"
            }`}
            aria-label={t("changeTo", {language: LOCALE_LABELS[item]})}
          >
            {LOCALE_LABELS[item]}
          </button>
        </span>
      ))}
    </div>
  );
}
