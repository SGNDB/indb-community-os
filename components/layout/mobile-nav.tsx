"use client";

import {Gift, HandHeart, Home, Images, Lightbulb, Newspaper, UserRound} from "lucide-react";
import {useTranslations} from "next-intl";

import {Link, usePathname} from "@/lib/i18n/routing";
import {cn} from "@/lib/utils/cn";

const bottomItems = [
  {href: "/", key: "home"},
  {href: "/feed", key: "feed"},
  {href: "/memory", key: "memory"},
  {href: "/ideas", key: "ideas"},
  {href: "/fadla", key: "fadla"},
  {href: "/support", key: "support"},
  {href: "/profile", key: "profile"},
] as const;

const iconMap = {
  "/": Home,
  "/feed": Newspaper,
  "/memory": Images,
  "/ideas": Lightbulb,
  "/fadla": Gift,
  "/support": HandHeart,
  "/profile": UserRound,
} as const;

export function MobileNav() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] ps-[max(0.5rem,env(safe-area-inset-left))] pe-[max(0.5rem,env(safe-area-inset-right))] pt-0 shadow-[0_-8px_20px_rgba(7,31,54,0.08)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-7 items-stretch">
        {bottomItems.map((item) => {
          const Icon = iconMap[item.href as keyof typeof iconMap];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href as never}
                prefetch={true}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium select-none transition-colors duration-75 min-[390px]:text-[11px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
                style={{WebkitTapHighlightColor: "transparent", touchAction: "manipulation", minWidth: "44px"}}
              >
                <div className={cn(
                  "flex min-h-[28px] min-w-[38px] items-center justify-center rounded-lg transition-colors duration-75 min-[390px]:min-w-[42px]",
                  active ? "bg-primary/10" : "",
                )}>
                  {Icon ? <Icon size={22} /> : null}
                </div>
                <span className="w-full truncate text-center leading-tight">{t(`items.${item.key}.short`)}</span>
                {active ? (
                  <span className="absolute -top-px left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-primary" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
