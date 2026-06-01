"use client";

import {useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";

import {localeLabels} from "@/lib/i18n/routing";
import {usePathname, useRouter} from "@/lib/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const locales = ["en", "fr", "ar"] as const;

  async function changeLanguage(nextLocale: (typeof locales)[number]) {
    if (nextLocale === locale) {
      return;
    }

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
    <div className="flex items-center gap-1 rounded-full border border-border p-1" aria-label={t("label")}>
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => changeLanguage(item)}
          disabled={isPending}
          className={`rounded-full px-2 py-1 text-xs font-medium transition ${
            item === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          aria-label={t("changeTo", {language: localeLabels[item]})}
        >
          {localeLabels[item]}
        </button>
      ))}
    </div>
  );
}


