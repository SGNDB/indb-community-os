import {createNavigation} from "next-intl/navigation";
import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "fr", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  localeDetection: false,
});

export const localeLabels: Record<string, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
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

