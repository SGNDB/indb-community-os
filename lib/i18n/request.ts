import {hasLocale} from "next-intl";
import {getRequestConfig} from "next-intl/server";

import {routing} from "@/lib/i18n/routing";

const BROKEN_TRANSLATION_PATTERN = /\?{3,}/;

function sanitizeDevTranslations(
  value: unknown,
  keyPath: string[] = [],
  warnings: string[] = [],
): unknown {
  if (typeof value === "string") {
    if (BROKEN_TRANSLATION_PATTERN.test(value)) {
      const resolvedKey = keyPath.length ? keyPath.join(".") : "root";
      warnings.push(resolvedKey);
      return `[missing translation: ${resolvedKey}]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeDevTranslations(item, [...keyPath, `${index}`], warnings),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeDevTranslations(item, [...keyPath, key], warnings),
      ]),
    );
  }

  return value;
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const warnings: string[] = [];
  const sanitizedMessages =
    process.env.NODE_ENV === "production"
      ? messages
      : (sanitizeDevTranslations(messages, [], warnings) as typeof messages);

  if (warnings.length) {
    console.warn(
      `[i18n] Replaced ${warnings.length} placeholder translation value(s) for "${locale}": ${warnings.join(", ")}`,
    );
  }

  return {
    locale,
    messages: sanitizedMessages,
  };
});
