import {ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, HeartHandshake, Images, ShieldCheck, Target, Users} from "lucide-react";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {SupportContributionPanel} from "@/components/support/support-contribution-panel";
import {SupportCampaignVisual} from "@/components/support/support-campaign-visual";
import {Badge} from "@/components/ui/badge";
import {createClient} from "@/lib/supabase/server";
import {getCampaignProgress, getDaysRemaining, getSupportCampaignBySlug} from "@/lib/data/support";
import {Link} from "@/lib/i18n/routing";

const formatter = new Intl.NumberFormat("fr-MR");

function campaignStatusMessage(status: string | undefined, locale: string, contributionSent: string, saved: string) {
  if (!status) return null;
  const isArabic = locale === "ar";
  const messages: Record<string, string> = {
    "contribution-sent": isArabic
      ? "شكراً لمساهمتك ❤ تبرعك قيد التحقق، وستصلك إشعار عند تأكيده."
      : "Thank you for your donation. It is pending verification and you will be notified once confirmed.",
    "cards-coming-soon": isArabic
      ? "الدفع عبر Visa / Mastercard قريباً. استخدم Bankily أو Masrivi أو Sedad حالياً."
      : "Visa / Mastercard is coming soon. Please use Bankily, Masrivi, or Sedad for now.",
    "invalid-payment": isArabic ? "تحقق من المبلغ وطريقة الدفع." : "Check the amount and payment method.",
    "transaction-required": isArabic ? "أدخل رقم العملية لإرسال التبرع." : "Enter the transaction ID to submit the donation.",
    "payment-not-ready": isArabic ? "طريقة الدفع هذه لم يتم إعداد حسابها الرسمي بعد." : "This payment method does not have an official receiver configured yet.",
    "receipt-invalid": isArabic ? "صورة الوصل يجب أن تكون JPG أو PNG أو WebP." : "Receipt must be JPG, PNG, or WebP.",
    "receipt-upload-failed": isArabic ? "تعذر رفع صورة الوصل. حاول مرة أخرى." : "Could not upload the receipt image. Please try again.",
  };
  return messages[status] ?? (status === "contribution-sent" ? contributionSent : saved);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});
  const result = await getSupportCampaignBySlug(slug);

  return {
    title: result?.campaign.title ?? t("support.title"),
    description: result?.campaign.description ?? t("support.description"),
  };
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale, slug} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Support"});
  const result = await getSupportCampaignBySlug(slug);
  if (!result) notFound();

  const {campaign, updates, photos} = result;
  const progress = getCampaignProgress(campaign);
  const daysRemaining = getDaysRemaining(campaign);
  const remaining = Math.max(0, campaign.goal_amount - campaign.raised_amount);
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const statusText = campaignStatusMessage(status, locale, t("status.contributionSent"), t("status.saved"));
  const statCards = [
    [t("goal"), `${formatter.format(campaign.goal_amount)} MRU`, Target],
    [t("raised"), `${formatter.format(campaign.raised_amount)} MRU`, HeartHandshake],
    [t("remaining"), `${formatter.format(remaining)} MRU`, Clock3],
    [t("contributors"), formatter.format(campaign.contributors_count), Users],
  ] as const;

  return (
    <div className="space-y-4 pb-28 sm:space-y-5">
      <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
        <ArrowRight size={16} />
        {t("backToSupport")}
      </Link>

      {statusText ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm font-bold text-primary">
          {statusText}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-5">
        <div className="space-y-5">
          <SupportCampaignVisual
            emoji={campaign.emoji}
            title={campaign.title}
            tone={campaign.visual.tone}
            accent={campaign.visual.accent}
            className="min-h-64 sm:min-h-80"
          />

          <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-[0_12px_34px_rgba(8,33,56,0.06)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="mb-3 gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                  <CheckCircle2 size={14} />
                  {t("verified")}
                </Badge>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{campaign.emoji} {campaign.title}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{campaign.long_description}</p>
              </div>
              <Badge className={campaign.status === "completed" ? "bg-emerald-500/10 text-emerald-700" : ""}>
                {t(`campaignStatus.${campaign.status}`)}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {statCards.map(([label, value, Icon]) => (
                <div key={label} className="rounded-2xl bg-muted/40 p-3">
                  <Icon size={18} className="text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">{label}</p>
                  <p className="font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm font-bold">
                <span>{progress}%</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock3 size={14} />
                  {t("daysRemaining").replace("{count}", formatter.format(daysRemaining))}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{width: `${progress}%`}} />
              </div>
            </div>
          </div>

          <section className="grid gap-4 lg:grid-cols-3">
            {[
              [t("whyTitle"), t("whyDescription")],
              [t("beneficiariesTitle"), t("beneficiariesDescription")],
              [t("timelineTitle"), t("timelineDescription")],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-border/70 bg-card p-4">
                <h2 className="text-lg font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
            <p className="text-sm font-bold text-primary">{t("transparency.title")}</p>
            <h2 className="text-xl font-black sm:text-2xl">{t("transparency.heading")}</h2>
            <div className="mt-4 grid gap-3 min-[420px]:grid-cols-4">
              <div className="rounded-2xl bg-muted/40 p-4">
                <ShieldCheck size={20} className="text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{t("transparency.organizer")}</p>
                <p className="font-black">{campaign.organizer}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <p className="mt-3 text-xs text-muted-foreground">{t("transparency.status")}</p>
                <p className="font-black">{t("verifiedWithCheck")}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <CalendarDays size={20} className="text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{t("transparency.start")}</p>
                <p className="font-black">{new Date(campaign.starts_at).toLocaleDateString(locale)}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <Clock3 size={20} className="text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{t("transparency.lastUpdate")}</p>
                <p className="font-black">{new Date(campaign.last_update_at).toLocaleDateString(locale)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
            <p className="text-sm font-bold text-primary">{t("updates")}</p>
            <h2 className="text-xl font-black sm:text-2xl">{t("updatesTimeline")}</h2>
            <div className="mt-5 space-y-0">
              {updates.length > 0 ? updates.map((update, index) => (
                <div key={update.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText size={17} />
                    </span>
                    {index < updates.length - 1 ? <span className="h-10 w-px bg-border" /> : null}
                  </div>
                  <div className="pb-5">
                    <p className="font-black">{update.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{update.body}</p>
                  </div>
                </div>
              )) : (
                <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">{t("noUpdates")}</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
            <p className="text-sm font-bold text-primary">{t("photos")}</p>
            <h2 className="text-xl font-black sm:text-2xl">{t("photosTitle")}</h2>
            {photos.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.image_url} alt={photo.caption ?? campaign.title} className="aspect-[4/3] w-full object-cover" />
                    {photo.caption ? <figcaption className="p-3 text-xs text-muted-foreground">{photo.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                <Images size={20} />
                {t("photosComingSoon")}
              </div>
            )}
          </section>

          {campaign.status === "completed" || campaign.final_report ? (
            <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
              <p className="text-sm font-bold text-emerald-700">{t("completion.title")}</p>
              <h2 className="text-xl font-black sm:text-2xl">{t("completion.heading")}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{campaign.final_report ?? t("completion.defaultReport")}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <SupportContributionPanel
            campaignId={campaign.id}
            campaignSlug={campaign.slug}
            campaignTitle={campaign.title}
            campaignEmoji={campaign.emoji}
            locale={locale}
            isLoggedIn={!!user}
          />
        </div>
      </section>

      <a
        href="#donate"
        className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex min-h-13 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_30px_rgba(237,33,36,0.35)] lg:hidden"
      >
        {t("donateNow")}
      </a>
    </div>
  );
}
