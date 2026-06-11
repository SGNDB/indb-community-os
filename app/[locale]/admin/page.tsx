import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Flame,
  HeartHandshake,
  Lightbulb,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {
  AdminStatusMessage,
  Avatar,
  ShellCard,
  activityIcons,
  contentIcons,
  displayName,
  formatDate,
} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {getContributionRankKey} from "@/lib/contribution";
import {
  getAdminOverview,
  getAdminPulse,
  getCurrentAdminProfile,
  getNewestMembers,
  getRecentAdminActivity,
  getTopContributors,
} from "@/lib/data/admin";
import {Link} from "@/lib/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("admin.title"),
    description: t("admin.description"),
  };
}

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});
  const [adminProfile, overview, pulse, topContributors, newestMembers, activity] = await Promise.all([
    getCurrentAdminProfile(),
    getAdminOverview(),
    getAdminPulse(),
    getTopContributors(),
    getNewestMembers(),
    getRecentAdminActivity(),
  ]);

  const healthCards = [
    {label: t("health.members"), value: overview.totalUsers, indicator: t("health.newToday", {count: overview.newMembersToday}), icon: Users, glow: "from-red-500/18 to-red-500/5"},
    {label: t("health.posts"), value: overview.totalPosts, indicator: t("health.today", {count: overview.postsToday}), icon: Newspaper, glow: "from-zinc-900/10 to-zinc-900/0"},
    {label: t("health.ideas"), value: overview.totalIdeas, indicator: t("health.today", {count: overview.ideasToday}), icon: Lightbulb, glow: "from-amber-400/20 to-amber-400/5"},
    {label: t("health.memories"), value: overview.totalMemories, indicator: t("health.today", {count: overview.memoriesToday}), icon: BookOpen, glow: "from-blue-500/16 to-blue-500/5"},
    {label: t("health.activeToday"), value: overview.activeToday, indicator: t("health.activeSignal"), icon: Flame, glow: "from-red-500/22 to-orange-400/5"},
  ];

  const actionCards = [
    {label: t("actions.awardCredits"), description: t("actions.awardCreditsDescription"), href: `/${locale}/admin/credits`, icon: Award},
    {label: t("actions.reviewReports"), description: t("actions.reviewReportsDescription"), href: `/${locale}/admin/content`, icon: ShieldCheck},
    {label: t("actions.viewUsers"), description: t("actions.viewUsersDescription"), href: `/${locale}/admin/users`, icon: Users},
    {label: t("actions.analytics"), description: t("actions.analyticsDescription"), href: `/${locale}/admin/analytics`, icon: BarChart3},
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-[0_8px_24px_rgba(12,31,44,0.07)] sm:p-5" aria-label={t("hero.title")}>
        <div className="absolute inset-y-0 start-0 w-1 bg-primary" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              <Sparkles size={14} />
              {t("eyebrow")}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{t("hero.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t("hero.description")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("signedInLabel")}</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar profile={adminProfile} className="h-9 w-9" />
              <div>
                <p className="text-sm font-bold">{displayName(adminProfile)}</p>
                <p className="text-xs text-muted-foreground">{t("roles.admin")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdminStatusMessage status={status} t={t} />

      <section className="space-y-3" aria-label={t("sections.overview")}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-primary">{t("health.eyebrow")}</p>
            <h2 className="text-2xl font-black">{t("health.title")}</h2>
          </div>
          <Badge className="hidden rounded-full px-3 py-1 sm:inline-flex">
            {t("health.totalComments", {count: overview.totalComments})}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {healthCards.map((card) => {
            const Icon = card.icon;
            return (
              <ShellCard key={card.label} className="relative overflow-hidden p-3">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.glow}`} />
                <div className="relative">
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
                </div>
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
                  <div className="mt-4 flex items-center gap-2">
                    <Avatar profile={item.author} className="h-8 w-8" />
                    <span className="truncate text-xs font-semibold text-muted-foreground">{displayName(item.author)}</span>
                  </div>
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

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <ShellCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary">{t("contributors.eyebrow")}</p>
              <h2 className="text-2xl font-black">{t("contributors.title")}</h2>
            </div>
            <HeartHandshake className="text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {topContributors.map((contributor, index) => {
              const rank = getContributionRankKey(contributor.contribution_score ?? 0);
              return (
                <div key={contributor.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">#{index + 1}</span>
                  <Avatar profile={contributor} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{displayName(contributor)}</p>
                    <p className="truncate text-xs text-muted-foreground">{t(`contributors.rank.${rank}`)}</p>
                  </div>
                  <Badge className="rounded-full px-3 py-1">{contributor.contribution_score ?? 0}</Badge>
                </div>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard className="p-5 sm:p-6">
          <p className="text-sm font-bold text-primary">{t("actions.eyebrow")}</p>
          <h2 className="text-2xl font-black">{t("actions.title")}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {actionCards.map((action) => {
              const Icon = action.icon;
              return (
                <a key={action.href} href={action.href} className="group min-h-28 rounded-2xl border border-border bg-muted/30 p-4 transition hover:border-primary/30 hover:bg-primary/5">
                  <Icon size={23} className="text-primary" />
                  <p className="mt-5 font-black">{action.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </a>
              );
            })}
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
