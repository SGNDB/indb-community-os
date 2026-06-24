"use client";

import {useState} from "react";
import {Search, Landmark, CheckCircle, XCircle} from "lucide-react";
import {adminSetDonationStatusAction} from "@/app/[locale]/server-actions";

interface Donation {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  contributor: {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function AdminDonationsClient({locale, initialDonations}: {locale: string; initialDonations: Donation[]}) {
  const [donations, setDonations] = useState(initialDonations);
  const [search, setSearch] = useState("");

  const filtered = donations.filter(
    (d) =>
      d.contributor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.payment_method?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search donations..."
          className="h-11 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((donation) => (
          <div key={donation.id} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="shrink-0 text-emerald-500" />
                  <span className="text-sm font-semibold text-foreground">{Number(donation.amount).toLocaleString()} MRU</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[donation.status] || ""}`}>
                    {donation.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {donation.contributor?.full_name ?? donation.contributor?.username ?? "Anonymous"}
                  {donation.payment_method ? ` via ${donation.payment_method}` : ""}
                  {" · "}{new Date(donation.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {donation.status === "pending" && (
                  <>
                    <form action={adminSetDonationStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="contributionId" value={donation.id} />
                      <input type="hidden" name="nextStatus" value="verified" />
                      <button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-green-100 hover:text-green-700" title="Verify">
                        <CheckCircle size={16} />
                      </button>
                    </form>
                    <form action={adminSetDonationStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="contributionId" value={donation.id} />
                      <input type="hidden" name="nextStatus" value="rejected" />
                      <button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-700" title="Reject">
                        <XCircle size={16} />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No donations found.</p>
        )}
      </div>
    </div>
  );
}
