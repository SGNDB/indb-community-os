import {createNavigation} from "next-intl/navigation";
import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export const localeLabels: Record<string, string> = {
  en: "🇺🇸 English",
  fr: "🇫🇷 Français",
  ar: "🇲🇷 العربية",
};

export const roleLabels = [
  "visitor",
  "member",
  "contributor",
  "historian",
  "moderator",
  "admin",
] as const;

export type AppRole = (typeof roleLabels)[number];

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(
  routing,
);

