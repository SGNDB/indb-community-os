import {Search, Landmark, Check, X, Clock} from "lucide-react";
import {getTranslations} from "next-intl/server";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {getAdminPayments, getAdminDonationTrend} from "@/lib/data/admin";
import {displayName} from "@/components/admin/admin-shared";

export default async function AdminPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{search?: string}>;
}) {
  const {locale} = await params;
  const {search = ""} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});
  const [payments, donationTrend] = await Promise.all([
    getAdminPayments(search),
    getAdminDonationTrend(),
  ]);

  const fmtCurrency = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "MRU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const pendingCount = payments.filter((p) => p.payment_status === "pending").length;
  const verifiedCount = payments.filter((p) => p.payment_status === "verified").length;
  const stats = [
    {label: t("paymentsPage.totalCollected"), value: fmtCurrency(totalCollected), color: "text-emerald-600"},
    {label: t("paymentsPage.thisMonth"), value: fmtCurrency(donationTrend[donationTrend.length - 1]?.value ?? 0), color: "text-primary"},
    {label: t("paymentsPage.pending"), value: pendingCount, color: "text-amber-600"},
    {label: t("paymentsPage.verified"), value: verifiedCount, color: "text-emerald-600"},
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Landmark size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-primary">{t("paymentsPage.eyebrow")}</p>
            <h1 className="text-2xl font-black">{t("paymentsPage.title")}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("paymentsPage.description")}</p>
          </div>
        </div>
        <form className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={search} placeholder="Search payments..." className="min-h-12 rounded-2xl ps-9" />
          </div>
          <button type="submit" className="min-h-12 rounded-2xl border border-border px-5 text-sm font-black transition hover:bg-muted">
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>Contributor</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {payments.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">No payments found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 text-sm items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{displayName(payment.contributor)}</p>
                    {payment.campaign && (
                      <p className="truncate text-xs text-muted-foreground">{payment.campaign.title}</p>
                    )}
                  </div>
                </div>
                <span className="font-black text-foreground">{fmtCurrency(Number(payment.amount ?? 0))}</span>
                <Badge className="capitalize rounded-full">
                  {payment.payment_method ?? "\u2014"}
                </Badge>
                <Badge
                  className={`rounded-full ${
                    payment.payment_status === "verified"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : payment.payment_status === "pending"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {payment.payment_status === "verified" ? <Check size={12} className="mr-1" /> : payment.payment_status === "pending" ? <Clock size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                  {payment.payment_status ?? "unknown"}
                </Badge>
                <div className="flex items-center gap-2">
                  {payment.payment_status === "pending" && (
                    <>
                      <button className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {t("paymentsPage.approve")}
                      </button>
                      <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                        {t("paymentsPage.reject")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}