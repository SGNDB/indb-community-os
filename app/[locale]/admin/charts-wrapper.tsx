"use client";

import {useState, useEffect} from "react";
import dynamic from "next/dynamic";
import type {
  AdminDashboardKPI,
  AdminUserGrowthPoint,
  AdminActivityPoint,
  AdminDonationByCampaign,
  AdminVolunteerMonth,
  AdminActivityItem,
} from "@/lib/data/admin";

interface Labels {
  kpi: Record<string, string>;
  chartTitleUsers: string;
  chartTitleActivity: string;
  chartTitleDonations: string;
  chartTitleVolunteers: string;
  activityTitle: string;
  postsLabel: string;
  ideasLabel: string;
  memoriesLabel: string;
  usersLabel: string;
  donationsLabel: string;
  amountLabel: string;
  volunteersLabel: string;
  noData: string;
  totalDonations: string;
  activeToday: string;
  activeSignal: string;
  eyebrow: string;
  commandCenter: string;
  heroDescription: string;
}

const Charts = dynamic(() => import("./admin-dashboard-charts"), {ssr: false});

function SkeletonCard({className = ""}: {className?: string}) {
  return (
    <div className={`animate-pulse rounded-2xl border border-border/60 bg-card p-5 shadow-sm ${className}`}>
      <div className="space-y-3">
        <div className="h-3 w-16 rounded bg-muted-foreground/10" />
        <div className="h-5 w-40 rounded bg-muted-foreground/10" />
        <div className="h-32 w-full rounded-lg bg-muted-foreground/5" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/10" />
          <div className="h-8 w-56 animate-pulse rounded bg-muted-foreground/10" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted-foreground/5" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({length: 4}).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function ChartsWrapper(props: {
  kpis: AdminDashboardKPI[];
  userGrowth: AdminUserGrowthPoint[];
  communityActivity: AdminActivityPoint[];
  donationsByCampaign: AdminDonationByCampaign[];
  volunteerActivity: AdminVolunteerMonth[];
  recentActivity: AdminActivityItem[];
  labels: Labels;
  locale: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <LoadingSkeleton />;

  return <Charts {...props} />;
}
