import {createNavigation} from "next-intl/navigation";
import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "fr", "ff", "snk", "wo", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export const localeLabels: Record<string, string> = {
  ar: "العربية",
  fr: "Français",
  ff: "Pulaar",
  snk: "Soninké",
  wo: "Wolof",
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

