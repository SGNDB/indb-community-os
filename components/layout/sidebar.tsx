"use client";

import {
  CalendarDays,
  Compass,
  Home,
  Images,
  Lightbulb,
  ListChecks,
  Newspaper,
  UserRound,
} from "lucide-react";
import {useTranslations} from "next-intl";

import {Logo} from "@/components/layout/Logo";
import {Badge} from "@/components/ui/badge";
import {Link, usePathname} from "@/lib/i18n/routing";
import {cn} from "@/lib/utils/cn";

const navItems = [
  {href: "/", key: "home", icon: Home},
  {href: "/feed", key: "feed", icon: Newspaper},
  {href: "/memory", key: "memory", icon: Images},
  {href: "/ideas", key: "ideas", icon: Lightbulb},
  {href: "/polls", key: "polls", icon: ListChecks},
  {href: "/events", key: "events", icon: CalendarDays},
  {href: "/projects", key: "projects", icon: Compass},
  {href: "/profile", key: "profile", icon: UserRound},
] as const;

export function Sidebar() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  return (
    <div className="sticky top-22 space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_12px_30px_rgba(7,31,54,0.08)]">
        <Logo variant="full" size="md" />
      </div>

      <nav className="rounded-2xl border border-border/70 bg-card p-2 shadow-[0_12px_30px_rgba(7,31,54,0.08)]">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} />
                    {t(`items.${item.key}.label`)}
                  </span>
                  {item.href === "/feed" ? (
                    <Badge className={cn(active ? "bg-primary-foreground/20 text-primary-foreground" : "")}>12</Badge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

