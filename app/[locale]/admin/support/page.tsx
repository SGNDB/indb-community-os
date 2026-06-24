import {Ban, CheckCircle2, FilePlus2, ReceiptText, RotateCcw, Save} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {adminCreateSupportCampaignAction, adminCreateSupportUpdateAction, adminSetSupportContributionStatusAction, adminUpdateSupportCampaignAction} from "@/app/[locale]/server-actions";
import {ShellCard} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {getAdminSupportCampaigns, getAdminSupportContributions, getCampaignProgress} from "@/lib/data/support";

const formatter = new Intl.NumberFormat("fr-MR");

const adminPaymentLabels = {
  ar: {
    queueTitle: "مراجعة المساهمات المالية",
    queueDescription: "تحقق من التحويلات قبل إضافتها إلى إجمالي الحملة.",
    noDonations: "لا توجد مساهمات للمراجعة حالياً.",
    pending: "قيد المراجعة",
    verified: "موثقة",
    rejected: "مرفوضة",
    refunded: "مسترجعة",
    method: "طريقة الدفع",
    transaction: "رقم العملية",
    receipt: "عرض الوصل",
    verify: "توثيق",
    reject: "رفض",
    refund: "استرجاع",
    reason: "سبب الرفض أو الاسترجاع",
    contributor: "المساهم",
  },
  en: {
    queueTitle: "Payment verification queue",
    queueDescription: "Verify transfers before they are added to campaign totals.",
    noDonations: "No donations to review right now.",
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    refunded: "Refunded",
    method: "Payment method",
    transaction: "Transaction ID",
    receipt: "View receipt",
    verify: "Verify",
    reject: "Reject",
    refund: "Refund",
    reason: "Reason for rejection or refund",
    contributor: "Contributor",
  },
};

function paymentLabels(locale: string) {
  return locale === "ar" ? adminPaymentLabels.ar : adminPaymentLabels.en;
}

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

export default async function AdminSupportPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Support.admin"});
  const [campaigns, contributions] = await Promise.all([
    getAdminSupportCampaigns(),
    getAdminSupportContributions(),
  ]);
  const paymentT = paymentLabels(locale);
  const statusMessage = status?.startsWith("donation-")
    ? status === "donation-verified"
      ? paymentT.verified
      : status === "donation-rejected"
        ? paymentT.rejected
        : status === "donation-refunded"
          ? paymentT.refunded
          : null
    : status
      ? t(`status.${status}`)
      : null;

  return (
    <div className="space-y-4">
      <ShellCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-3 gap-1">
              <CheckCircle2 size={14} />
              {t("verifiedOnly")}
            </Badge>
            <h1 className="text-2xl font-black sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
          </div>
          {statusMessage ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {statusMessage}
            </span>
          ) : null}
        </div>
      </ShellCard>

      <ShellCard className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">{paymentT.pending}</p>
            <h2 className="text-xl font-black">{paymentT.queueTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{paymentT.queueDescription}</p>
          </div>
          <Badge>{contributions.filter((item) => item.status === "pending").length}</Badge>
        </div>

        {contributions.length > 0 ? (
          <div className="space-y-3">
            {contributions.map((contribution) => {
              const contributorName = contribution.contributor?.full_name ?? contribution.contributor?.username ?? "Community member";
              const statusLabel = paymentT[contribution.status] ?? contribution.status;
              return (
                <div key={contribution.id} className="rounded-2xl border border-border bg-muted/25 p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={contribution.status === "verified" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : ""}>
                          {statusLabel}
                        </Badge>
                        <span className="text-sm font-black">
                          {contribution.campaign?.emoji} {contribution.campaign?.title}
                        </span>
                        <span className="text-sm font-black text-primary">
                          {contribution.amount ? `${formatter.format(contribution.amount)} MRU` : contribution.contribution_type}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p><span className="font-bold text-foreground">{paymentT.contributor}:</span> {contributorName}</p>
                        <p><span className="font-bold text-foreground">{paymentT.method}:</span> {contribution.payment_method ?? "-"}</p>
                        <p className="break-all"><span className="font-bold text-foreground">{paymentT.transaction}:</span> {contribution.transaction_id ?? "-"}</p>
                        <p>{new Date(contribution.created_at).toLocaleString(locale)}</p>
                      </div>
                      {contribution.receipt_url ? (
                        <a
                          href={contribution.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                        >
                          <ReceiptText size={16} />
                          {paymentT.receipt}
                        </a>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:min-w-72">
                      {contribution.status !== "verified" ? (
                        <form action={adminSetSupportContributionStatusAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="contributionId" value={contribution.id} />
                          <input type="hidden" name="nextStatus" value="verified" />
                          <Button type="submit" className="w-full gap-2">
                            <CheckCircle2 size={16} />
                            {paymentT.verify}
                          </Button>
                        </form>
                      ) : (
                        <form action={adminSetSupportContributionStatusAction} className="space-y-2">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="contributionId" value={contribution.id} />
                          <input type="hidden" name="nextStatus" value="refunded" />
                          <Input name="rejectedReason" placeholder={paymentT.reason} />
                          <Button type="submit" variant="outline" className="w-full gap-2">
                            <RotateCcw size={16} />
                            {paymentT.refund}
                          </Button>
                        </form>
                      )}

                      {contribution.status === "pending" ? (
                        <form action={adminSetSupportContributionStatusAction} className="space-y-2">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="contributionId" value={contribution.id} />
                          <input type="hidden" name="nextStatus" value="rejected" />
                          <Input name="rejectedReason" placeholder={paymentT.reason} />
                          <Button type="submit" variant="outline" className="w-full gap-2 text-destructive">
                            <Ban size={16} />
                            {paymentT.reject}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">{paymentT.noDonations}</p>
        )}
      </ShellCard>

      <ShellCard className="p-4 sm:p-5">
        <form action={adminCreateSupportCampaignAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <p className="text-sm font-bold text-primary">{t("createEyebrow")}</p>
            <h2 className="text-xl font-black">{t("createTitle")}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[90px_1fr_1fr]">
            <Input name="emoji" placeholder="🤝" maxLength={8} />
            <Input name="title" placeholder={t("createName")} required />
            <Input name="slug" placeholder="campaign-slug" required />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input name="description" placeholder={t("createDescription")} required />
            <Input name="goalAmount" type="number" min="1" step="1" placeholder={t("goalAmount")} required />
            <Input name="endsAt" type="date" required />
          </div>
          <Textarea name="longDescription" placeholder={t("createLongDescription")} className="min-h-24" required />
          <Button type="submit" variant="outline" className="gap-2">
            <FilePlus2 size={16} />
            {t("create")}
          </Button>
        </form>
      </ShellCard>

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const progress = getCampaignProgress(campaign);
          return (
            <ShellCard key={campaign.id} className="p-4 sm:p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                <form action={adminUpdateSupportCampaignAction} className="space-y-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black">{campaign.emoji} {campaign.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
                    </div>
                    <Badge>{progress}%</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm font-bold">
                      {t("raisedAmount")}
                      <Input name="raisedAmount" type="number" min="0" step="1" defaultValue={campaign.raised_amount} />
                    </label>
                    <label className="space-y-1 text-sm font-bold">
                      {t("contributors")}
                      <Input name="contributorsCount" type="number" min="0" step="1" defaultValue={campaign.contributors_count} />
                    </label>
                    <label className="space-y-1 text-sm font-bold">
                      {t("volunteers")}
                      <Input name="volunteersCount" type="number" min="0" step="1" defaultValue={campaign.volunteers_count} />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                    <label className="space-y-1 text-sm font-bold">
                      {t("statusLabel")}
                      <select name="campaignStatus" defaultValue={campaign.status} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="active">{t("statuses.active")}</option>
                        <option value="paused">{t("statuses.paused")}</option>
                        <option value="completed">{t("statuses.completed")}</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-bold">
                      {t("finalReport")}
                      <Textarea name="finalReport" defaultValue={campaign.final_report ?? ""} className="min-h-24" />
                    </label>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>{formatter.format(campaign.raised_amount)} / {formatter.format(campaign.goal_amount)} MRU</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{width: `${progress}%`}} />
                    </div>
                  </div>

                  <Button type="submit" className="gap-2">
                    <Save size={16} />
                    {t("save")}
                  </Button>
                </form>

                <form action={adminCreateSupportUpdateAction} className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <div className="flex items-center gap-2 font-black">
                    <FilePlus2 size={18} className="text-primary" />
                    {t("publishUpdate")}
                  </div>
                  <Input name="title" placeholder={t("updateTitle")} required />
                  <Textarea name="body" placeholder={t("updateBody")} className="min-h-28" required />
                  <Button type="submit" variant="outline" className="w-full">
                    {t("publish")}
                  </Button>
                </form>
              </div>
            </ShellCard>
          );
        })}
      </div>
    </div>
  );
}
