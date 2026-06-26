import {Megaphone, CheckCircle2, HandHeart, PackageCheck, Search, ShieldCheck, Sparkles, Users} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {SupportCampaignCard} from "@/components/support/support-campaign-card";
import {Badge} from "@/components/ui/badge";
import {getLatestSupportUpdates, getSupportCampaigns, getSupportImpact} from "@/lib/data/support";

const formatter = new Intl.NumberFormat("fr-MR");

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("support.title"),
    description: t("support.description"),
  };
}

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Support"});
  const [campaigns, impact, latestUpdates] = await Promise.all([
    getSupportCampaigns(),
    getSupportImpact(),
    getLatestSupportUpdates(3),
  ]);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
  const completedCampaigns = campaigns.filter((campaign) => campaign.status === "completed");
  const featured = activeCampaigns[0] ?? campaigns[0];
  const impactCards = [
    {label: t("impact.totalDonations"), value: `${formatter.format(impact.totalRaised)} MRU`, icon: HandHeart},
    {label: t("impact.contributors"), value: formatter.format(impact.contributors), icon: Users},
    {label: t("sections.activeCampaigns"), value: formatter.format(activeCampaigns.length), icon: Megaphone},
    {label: t("updates"), value: formatter.format(latestUpdates.length), icon: CheckCircle2},
    {label: t("ways.volunteer"), value: formatter.format(campaigns.reduce((sum, campaign) => sum + campaign.volunteers_count, 0)), icon: Sparkles},
    {label: t("impact.completed"), value: formatter.format(impact.completed), icon: PackageCheck},
  ];
  const categories = [
    ["water", "💧", t("admin.campaignWater")],
    ["education", "🎒", t("admin.campaignEducation")],
    ["families", "🍲", t("admin.campaignFamilies")],
    ["clean", "🧹", t("admin.campaignClean")],
    ["health", "🏥", t("admin.campaignHealth")],
  ];

  return (
    <div className="space-y-6 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-amber-400/10 p-5 shadow-[0_18px_50px_rgba(8,33,56,0.08)] sm:p-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-primary" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
          <div>
            <Badge className="mb-4 gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary">
              <ShieldCheck size={14} />
              {t("verifiedHub")}
            </Badge>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t("description")}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a href="#active-campaigns" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-[0_10px_24px_rgba(237,33,36,0.22)]">
                <Megaphone size={18} />
                {t("sections.activeCampaigns")}
              </a>
              <a href="#impact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-black">
                <Sparkles size={18} />
                {t("sections.impact")}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-3xl border border-border/60 bg-card/70 p-3 backdrop-blur">
            <div className="rounded-2xl bg-primary/10 p-4">
              <HandHeart size={20} className="text-primary" />
              <p className="mt-4 text-2xl font-black text-primary">{formatter.format(impact.totalRaised)} MRU</p>
              <p className="text-xs text-muted-foreground">{t("impact.totalDonations")}</p>
            </div>
            <div className="rounded-2xl bg-muted/45 p-4">
              <Users size={20} className="text-primary" />
              <p className="mt-4 text-2xl font-black">{formatter.format(impact.contributors)}</p>
              <p className="text-xs text-muted-foreground">{t("impact.contributors")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-[0_12px_34px_rgba(8,33,56,0.06)] sm:p-5">
          <p className="text-sm font-bold text-primary">{t("sections.featuredCampaign")}</p>
          {featured ? (
            <div className="mt-4">
              <h2 className="mb-4 text-2xl font-black">{featured.title}</h2>
              <SupportCampaignCard
                campaign={featured}
                contributeLabel={t("donateNow")}
                contributorsLabel={t("contributorsCount")}
                daysLabel={t("daysRemaining")}
                goalLabel={t("goal")}
                raisedLabel={t("raised")}
                verifiedLabel={t("verified")}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">{t("noUpdates")}</p>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
          <p className="text-sm font-bold text-primary">{t("searchFilters.title")}</p>
          <div className="mt-4 flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-muted/35 px-3">
            <Search size={18} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">{t("searchFilters.placeholder")}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["all", "active", "endingSoon", "mostFunded", "completed", "recent"].map((key) => (
              <Badge key={key} className="rounded-full bg-muted text-foreground hover:bg-muted">
                {t(`searchFilters.${key}`)}
              </Badge>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <p className="text-sm font-black">{t("sections.campaignCategories")}</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(([key, icon, label]) => (
                <div key={key} className="rounded-2xl bg-muted/35 p-3 text-sm font-bold">
                  <span className="me-1 text-lg">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="active-campaigns" className="space-y-3">
        <div>
          <p className="text-sm font-bold text-primary">{t("sections.activeCampaigns")}</p>
          <h2 className="text-2xl font-black">{t("campaignsTitle")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeCampaigns.slice(1).map((campaign) => (
            <SupportCampaignCard
              key={campaign.slug}
              campaign={campaign}
              contributeLabel={t("donateNow")}
              contributorsLabel={t("contributorsCount")}
              daysLabel={t("daysRemaining")}
              goalLabel={t("goal")}
              raisedLabel={t("raised")}
              verifiedLabel={t("verified")}
            />
          ))}
          {activeCampaigns.slice(1).length === 0 ? (
            <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">{t("noUpdates")}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
          <p className="text-sm font-bold text-primary">{t("sections.latestUpdates")}</p>
          <h2 className="text-2xl font-black">{t("updatesTitle")}</h2>
          <div className="mt-5 space-y-0">
            {latestUpdates.length > 0 ? latestUpdates.map((update, index) => {
              const campaign = campaigns.find((item) => item.id === update.campaign_id);
              return (
                <div key={update.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {campaign?.emoji ?? "📢"}
                    </span>
                    {index < latestUpdates.length - 1 ? <span className="h-10 w-px bg-border" /> : null}
                  </div>
                  <div className="pb-5">
                    <p className="font-black">{update.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{update.body}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">{t("noUpdates")}</p>
            )}
          </div>
        </div>

        <div id="impact" className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
          <p className="text-sm font-bold text-primary">{t("sections.impact")}</p>
          <h2 className="text-2xl font-black">{t("impactTitle")}</h2>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {impactCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl bg-muted/40 p-3">
                  <Icon size={18} className="text-primary" />
                  <p className="mt-3 text-xl font-black">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {completedCampaigns.length > 0 ? (
        <section className="space-y-3">
          <div>
            <p className="text-sm font-bold text-primary">{t("sections.completedCampaigns")}</p>
            <h2 className="text-2xl font-black">{t("completedCampaignsTitle")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedCampaigns.map((campaign) => (
              <SupportCampaignCard
                key={campaign.slug}
                campaign={campaign}
                contributeLabel={t("viewReport")}
                contributorsLabel={t("contributorsCount")}
                daysLabel={t("daysRemaining")}
                goalLabel={t("goal")}
                raisedLabel={t("raised")}
                verifiedLabel={t("verified")}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="mt-1 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-xl font-black">{t("transparency.heading")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("transparency.description")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
