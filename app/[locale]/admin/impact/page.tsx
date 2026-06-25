import {Award, BookOpen, Gift, HandHeart, HeartHandshake, Lightbulb, TrendingUp, UsersRound} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {AdminAvatar, GlassCard, SectionHeader} from "@/components/admin/admin-shared";
import {getCommunityImpactAdminSummary, type CommunityImpactAdminContributor} from "@/lib/data/community-impact";

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US").format(value);
}

function formatCurrency(value: number, locale: string) {
  return `${formatNumber(Math.round(value), locale)} MRU`;
}

function ContributorList({
  title,
  people,
  locale,
  emptyLabel,
}: {
  title: string;
  people: CommunityImpactAdminContributor[];
  locale: string;
  emptyLabel: string;
}) {
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {people.length > 0 ? (
          people.map((person) => (
            <div key={`${title}-${person.user_id}`} className="flex items-center gap-3 rounded-2xl bg-muted/35 p-2.5">
              <AdminAvatar profile={person} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{person.full_name ?? person.username ?? "-"}</p>
                <p className="truncate text-xs text-muted-foreground">@{person.username ?? person.user_id.slice(0, 8)}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                {formatNumber(person.metric, locale)}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-muted/35 p-4 text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </GlassCard>
  );
}

export default async function AdminImpactPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin.impactPage"});
  const summary = await getCommunityImpactAdminSummary();
  const cards = [
    {label: t("totalVolunteerHours"), value: formatNumber(summary.totals.volunteerHours, locale), icon: UsersRound},
    {label: t("totalDonations"), value: formatCurrency(summary.totals.donationsTotal, locale), icon: HandHeart},
    {label: t("familiesHelped"), value: formatNumber(summary.totals.familiesHelped, locale), icon: HeartHandshake},
    {label: t("graatekSuccessRate"), value: `${formatNumber(summary.totals.graatekSuccessRate, locale)}%`, icon: Gift},
    {label: t("ideasCompleted"), value: formatNumber(summary.totals.ideasCompleted, locale), icon: Lightbulb},
    {label: t("memoriesPublished"), value: formatNumber(summary.totals.memoriesPublished, locale), icon: BookOpen},
    {label: t("activeContributors"), value: formatNumber(summary.totals.activeContributors, locale), icon: Award},
  ];
  const maxGrowth = Math.max(1, ...summary.growth.map((point) => point.value));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-amber-400/10 p-6 shadow-[0_18px_50px_rgba(8,33,56,0.08)]">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={21} />
                </span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <p className="mt-4 text-2xl font-black">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="p-5">
        <SectionHeader eyebrow={t("analytics")} title={t("growthTitle")} />
        <div className="mt-5 flex h-44 items-end gap-2 rounded-3xl bg-muted/25 p-4">
          {summary.growth.length > 0 ? summary.growth.map((point) => (
            <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div
                className="min-h-2 rounded-t-2xl bg-gradient-to-t from-primary to-amber-400"
                style={{height: `${Math.max(8, (point.value / maxGrowth) * 100)}%`}}
              />
              <p className="truncate text-center text-[11px] text-muted-foreground">{point.label}</p>
            </div>
          )) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">{t("emptyState")}</div>
          )}
        </div>
      </GlassCard>

      <div>
        <SectionHeader eyebrow={t("leaderboardsEyebrow")} title={t("leaderboardsTitle")} />
        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <ContributorList title={t("topVolunteers")} people={summary.top.volunteers} locale={locale} emptyLabel={t("emptyState")} />
          <ContributorList title={t("topDonors")} people={summary.top.donors} locale={locale} emptyLabel={t("emptyState")} />
          <ContributorList title={t("topGraatek")} people={summary.top.graatek} locale={locale} emptyLabel={t("emptyState")} />
          <ContributorList title={t("topBuilders")} people={summary.top.builders} locale={locale} emptyLabel={t("emptyState")} />
          <ContributorList title={t("topMemories")} people={summary.top.memories} locale={locale} emptyLabel={t("emptyState")} />
          <ContributorList title={t("topIdeas")} people={summary.top.ideas} locale={locale} emptyLabel={t("emptyState")} />
        </div>
      </div>
    </div>
  );
}
