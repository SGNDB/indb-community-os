import {getTranslations} from "next-intl/server";
import {getAdminDonations} from "@/lib/data/admin";
import {AdminDonationsClient} from "./admin-donations-client";

export default async function AdminDonationsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const donations = await getAdminDonations();

  const totalRaised = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const pendingCount = donations.filter((d) => d.status === "pending").length;
  const verifiedCount = donations.filter((d) => d.status === "verified").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.donations")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage donations and payments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Raised</p>
          <p className="mt-1 text-2xl font-black text-foreground">{totalRaised.toLocaleString()} MRU</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Verified</p>
          <p className="mt-1 text-2xl font-black text-green-600">{verifiedCount}</p>
        </div>
      </div>

      <AdminDonationsClient locale={locale} initialDonations={donations} />
    </div>
  );
}
