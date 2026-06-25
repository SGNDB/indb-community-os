"use client";

import {
  Award,
  BadgeCheck,
  BookOpen,
  Gift,
  HandHeart,
  HeartHandshake,
  Lightbulb,
  type LucideIcon,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Link} from "@/lib/i18n/routing";
import type {CommunityImpactStats} from "@/lib/data/community-impact";

const moduleIcons = {
  donations: HandHeart,
  volunteering: UsersRound,
  graatek: Gift,
  ideas: Lightbulb,
  memories: BookOpen,
};

const levelOrder = [
  "community_supporter",
  "active_contributor",
  "community_builder",
  "community_champion",
  "guardian_of_nouadhibou",
] as const;

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US").format(value);
}

function formatCurrency(value: number, locale: string) {
  return `${formatNumber(Math.round(value), locale)} MRU`;
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatLine({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
      <span className="min-w-0 text-xs text-muted-foreground">{label}</span>
      <span className="shrink-0 text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

function ImpactModuleCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-[0_12px_34px_rgba(8,33,56,0.06)]">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={19} />
          </span>
          <h3 className="text-sm font-black">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function CommunityImpactSection({
  impact,
  locale,
  showPassportLink = true,
}: {
  impact: CommunityImpactStats;
  locale: string;
  showPassportLink?: boolean;
}) {
  const t = useTranslations("CommunityImpact");
  const levelIndex = Math.max(0, levelOrder.indexOf(impact.community_level));
  const progress = Math.max(8, Math.round(((levelIndex + 1) / levelOrder.length) * 100));
  const unlockedBadges = impact.badges.length ? impact.badges : ["community_builder" as const].filter(() => impact.active_modules >= 3);

  return (
    <section className="space-y-4">
      <Card className="overflow-hidden rounded-3xl border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_18px_50px_rgba(8,33,56,0.08)]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(237,33,36,0.22)]">
                <HeartHandshake size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("eyebrow")}</p>
                <h2 className="text-xl font-black sm:text-2xl">{t("title")}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
              </div>
            </div>
            {showPassportLink ? (
              <Link
                href="/impact"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_rgba(237,33,36,0.22)] transition hover:bg-primary/90"
              >
                <Sparkles size={16} />
                {t("passportLink")}
              </Link>
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{t("levelLabel")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Award size={21} className="text-primary" />
                  <p className="text-lg font-black">{t(`levels.${impact.community_level}`)}</p>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                    {t("modulesActive", {count: impact.active_modules})}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("notScore")}</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-rose-400 to-amber-400" style={{width: `${progress}%`}} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ImpactModuleCard title={t("modules.donations.title")} icon={moduleIcons.donations}>
          <StatLine label={t("modules.donations.total")} value={formatCurrency(impact.donations_total, locale)} />
          <StatLine label={t("modules.donations.count")} value={formatNumber(impact.donations_count, locale)} />
          <StatLine label={t("modules.donations.campaigns")} value={formatNumber(impact.campaigns_supported, locale)} />
          <StatLine label={t("modules.donations.last")} value={formatDate(impact.last_donation_at, locale, t("noActivity"))} />
        </ImpactModuleCard>

        <ImpactModuleCard title={t("modules.volunteering.title")} icon={moduleIcons.volunteering}>
          <StatLine label={t("modules.volunteering.hours")} value={formatNumber(impact.volunteer_hours, locale)} />
          <StatLine label={t("modules.volunteering.activities")} value={formatNumber(impact.volunteer_activities, locale)} />
          <StatLine label={t("modules.volunteering.attendance")} value={`${formatNumber(impact.volunteer_attendance_rate, locale)}%`} />
          <StatLine label={t("modules.volunteering.current")} value={formatNumber(impact.current_opportunities, locale)} />
        </ImpactModuleCard>

        <ImpactModuleCard title={t("modules.graatek.title")} icon={moduleIcons.graatek}>
          <StatLine label={t("modules.graatek.shared")} value={formatNumber(impact.graatek_shared, locale)} />
          <StatLine label={t("modules.graatek.completed")} value={formatNumber(impact.graatek_completed, locale)} />
          <StatLine label={t("modules.graatek.helped")} value={formatNumber(impact.graatek_people_helped, locale)} />
          <StatLine label={t("modules.graatek.rate")} value={`${formatNumber(impact.graatek_completion_rate, locale)}%`} />
        </ImpactModuleCard>

        <ImpactModuleCard title={t("modules.ideas.title")} icon={moduleIcons.ideas}>
          <StatLine label={t("modules.ideas.created")} value={formatNumber(impact.ideas_created, locale)} />
          <StatLine label={t("modules.ideas.supported")} value={formatNumber(impact.ideas_supported, locale)} />
          <StatLine label={t("modules.ideas.completed")} value={formatNumber(impact.ideas_completed, locale)} />
          <StatLine label={t("modules.ideas.participants")} value={formatNumber(impact.ideas_participants, locale)} />
        </ImpactModuleCard>

        <ImpactModuleCard title={t("modules.memories.title")} icon={moduleIcons.memories}>
          <StatLine label={t("modules.memories.created")} value={formatNumber(impact.memories_created, locale)} />
          <StatLine label={t("modules.memories.views")} value={formatNumber(impact.memories_views, locale)} />
          <StatLine label={t("modules.memories.reactions")} value={formatNumber(impact.memories_reactions, locale)} />
          <StatLine label={t("modules.memories.featured")} value={formatNumber(impact.memories_featured, locale)} />
        </ImpactModuleCard>
      </div>

      <Card className="rounded-2xl border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-black">{t("badgesTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("badgesDescription")}</p>
            </div>
            <BadgeCheck size={22} className="text-primary" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {unlockedBadges.length > 0 ? (
              unlockedBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <BadgeCheck size={14} />
                  {t(`badges.${badge}`)}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("noBadges")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
