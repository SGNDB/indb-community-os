import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {Award, BookOpen, Gift, HandHeart, HeartHandshake, Lightbulb, UsersRound} from "lucide-react";

import {CommunityImpactSection} from "@/components/profile/community-impact-section";
import {Card, CardContent} from "@/components/ui/card";
import {getCommunityImpact} from "@/lib/data/community-impact";
import {redirect} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "CommunityImpact"});
  return {
    title: t("passportTitle"),
    description: t("passportDescription"),
  };
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US").format(value);
}

function formatCurrency(value: number, locale: string) {
  return `${formatNumber(Math.round(value), locale)} MRU`;
}

export default async function CommunityImpactPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "CommunityImpact"});
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    redirect({href: "/login", locale});
    return null;
  }

  const impact = await getCommunityImpact(user.id);
  const year = new Date().getFullYear();
  const passportStats = [
    {label: t("passport.totalDonations"), value: formatCurrency(impact.donations_total, locale), icon: HandHeart},
    {label: t("passport.volunteerHours"), value: formatNumber(impact.volunteer_hours, locale), icon: UsersRound},
    {label: t("passport.familiesHelped"), value: formatNumber(impact.graatek_people_helped, locale), icon: HeartHandshake},
    {label: t("passport.campaignsJoined"), value: formatNumber(impact.campaigns_supported, locale), icon: Award},
    {label: t("passport.graatekExchanges"), value: formatNumber(impact.graatek_completed, locale), icon: Gift},
    {label: t("passport.ideasCompleted"), value: formatNumber(impact.ideas_completed, locale), icon: Lightbulb},
    {label: t("passport.memoriesShared"), value: formatNumber(impact.memories_created, locale), icon: BookOpen},
  ];

  const yearly = [
    {label: t("yearly.donated"), value: formatCurrency(impact.donations_total, locale)},
    {label: t("yearly.volunteered"), value: `${formatNumber(impact.volunteer_hours, locale)} ${t("hours")}`},
    {label: t("yearly.helped"), value: `${formatNumber(impact.graatek_people_helped, locale)} ${t("families")}`},
    {label: t("yearly.completedGraatek"), value: formatNumber(impact.graatek_completed, locale)},
    {label: t("yearly.participatedCampaigns"), value: formatNumber(impact.campaigns_supported, locale)},
    {label: t("yearly.sharedMemories"), value: formatNumber(impact.memories_created, locale)},
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-24">
      <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-amber-400/10 p-5 shadow-[0_18px_50px_rgba(8,33,56,0.08)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("passportEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("passportTitle")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{t("passportDescription")}</p>
      </div>

      <CommunityImpactSection impact={impact} locale={locale} showPassportLink={false} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {passportStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-2xl border-border/70">
              <CardContent className="p-4">
                <Icon size={20} className="text-primary" />
                <p className="mt-3 text-2xl font-black">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/70">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("yearly.eyebrow")}</p>
              <h2 className="text-2xl font-black">{t("yearly.title", {year})}</h2>
            </div>
            <p className="text-sm font-semibold text-primary">{t("yearly.thankYou")}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {yearly.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-2xl font-black">{t("leaderboards.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("leaderboards.description")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["volunteers", "donors", "graatek", "builders", "memories", "ideas"].map((key) => (
              <div key={key} className="rounded-2xl bg-muted/35 p-4">
                <p className="text-sm font-black">{t(`leaderboards.${key}`)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("leaderboards.separate")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
