import {Activity, BookOpen, Flame, Lightbulb, Newspaper, Users} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {
  Avatar,
  ShellCard,
  activityIcons,
  contentIcons,
  displayName,
  formatDate,
} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {
  getAdminOverview,
  getAdminPulse,
  getNewestMembers,
  getRecentAdminActivity,
} from "@/lib/data/admin";
import {Link} from "@/lib/i18n/routing";

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const [overview, pulse, newestMembers, activity] = await Promise.all([
    getAdminOverview(),
    getAdminPulse(),
    getNewestMembers(),
    getRecentAdminActivity(),
  ]);

  const healthCards = [
    {label: t("health.members"), value: overview.totalUsers, indicator: t("health.newToday", {count: overview.newMembersToday}), icon: Users},
    {label: t("health.posts"), value: overview.totalPosts, indicator: t("health.today", {count: overview.postsToday}), icon: Newspaper},
    {label: t("health.ideas"), value: overview.totalIdeas, indicator: t("health.today", {count: overview.ideasToday}), icon: Lightbulb},
    {label: t("health.memories"), value: overview.totalMemories, indicator: t("health.today", {count: overview.memoriesToday}), icon: BookOpen},
    {label: t("health.activeToday"), value: overview.activeToday, indicator: t("health.activeSignal"), icon: Flame},
  ];

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
          <div>
            <p className="text-sm font-bold text-primary">{t("health.eyebrow")}</p>
            <h1 className="text-2xl font-black">{t("health.title")}</h1>
          </div>
          <Badge className="hidden rounded-full px-3 py-1 sm:inline-flex">
            {t("health.totalComments", {count: overview.totalComments})}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {healthCards.map((card) => {
            const Icon = card.icon;
            return (
              <ShellCard key={card.label} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {card.indicator}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black">{card.value}</p>
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              </ShellCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <ShellCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary">{t("pulse.eyebrow")}</p>
              <h2 className="text-2xl font-black">{t("pulse.title")}</h2>
            </div>
            <Activity className="text-primary" />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {pulse.map((item) => {
              const Icon = item.type === "member" ? Users : contentIcons[item.type];
              return (
                <Link key={`${item.type}-${item.title}`} href={item.href} className="group rounded-2xl border border-border bg-muted/30 p-4 transition hover:border-primary/30 hover:bg-primary/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon size={19} />
                    </span>
                    <span className="text-xl font-black">{item.metric}</span>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{t(`pulse.type.${item.type}`)}</p>
                  <h3 className="mt-1 line-clamp-2 font-black group-hover:text-primary">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.subtitle ?? t("pulse.noPreview")}</p>
                </Link>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard className="p-5 sm:p-6">
          <p className="text-sm font-bold text-primary">{t("newMembers.eyebrow")}</p>
          <h2 className="text-2xl font-black">{t("newMembers.title")}</h2>
          <div className="mt-5 space-y-3">
            {newestMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3">
                <Avatar profile={member} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{displayName(member)}</p>
                  <p className="truncate text-sm text-muted-foreground">{member.username ? `@${member.username}` : t("users.noUsername")}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{formatDate(member.created_at, locale)}</span>
              </div>
            ))}
          </div>
        </ShellCard>
      </section>

      <ShellCard className="p-5 sm:p-6">
        <p className="text-sm font-bold text-primary">{t("activity.eyebrow")}</p>
        <h2 className="text-2xl font-black">{t("activity.title")}</h2>
        <div className="mt-5 space-y-0">
          {activity.map((item, index) => {
            const Icon = activityIcons[item.type];
            return (
              <Link key={item.id} href={item.href} className="grid grid-cols-[auto_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={17} />
                  </span>
                  {index < activity.length - 1 ? <span className="h-8 w-px bg-border" /> : null}
                </div>
                <div className="pb-5">
                  <p className="font-bold">{t(`activity.type.${item.type}`, {title: item.title, name: displayName(item.actor)})}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{item.subtitle ?? formatDate(item.created_at, locale)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </ShellCard>
    </>
  );
}
