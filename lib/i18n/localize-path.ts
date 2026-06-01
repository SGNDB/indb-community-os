import {getPathname} from "@/lib/i18n/routing";

export function localizePath(locale: string, pathname: string) {
  return getPathname({
    locale,
    href: pathname as "/",
  });
}


