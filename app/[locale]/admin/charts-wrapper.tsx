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
  AdminDonationTrend,
  AdminConversationTrend,
  AdminPaymentMethod,
  AdminHourlyPoint,
  AdminRealtimeActivity,
  AdminHealthIndicators,
} from "@/lib/data/admin";

interface Labels {
  kpi: Record<string, string>;
  communityGrowth: string;
  usersTab: string;
  ideasTab: string;
  graatekTab: string;
  donationsTab: string;
  volunteersTab: string;
  byCampaign: string;
  donationMethods: string;
  hourlyActivity: string;
  dailyMessages: string;
  realtimeActivity: string;
  growthRate: string;
  successRate: string;
  engagementRate: string;
  noData: string;
  eyebrow: string;
  commandCenter: string;
  heroDescription: string;
  healthEyebrow: string;
  healthTitle: string;
  members: string;
  posts: string;
  ideas: string;
  memories: string;
  activeToday: string;
  newToday: string;
  totalComments: string;
  adminName: string;
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
          <div className="h-10 w-64 animate-pulse rounded bg-muted-foreground/10" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted-foreground/5" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({length: 8}).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard />
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
  ideaGrowth: AdminUserGrowthPoint[];
  graatekGrowth: AdminUserGrowthPoint[];
  communityActivity: AdminActivityPoint[];
  donationsByCampaign: AdminDonationByCampaign[];
  volunteerActivity: AdminVolunteerMonth[];
  recentActivity: AdminActivityItem[];
  donationTrend: AdminDonationTrend[];
  conversationTrend: AdminConversationTrend[];
  paymentMethods: AdminPaymentMethod[];
  hourlyActivity: AdminHourlyPoint[];
  realtimeActivity: AdminRealtimeActivity[];
  health: AdminHealthIndicators;
  labels: Labels;
  locale: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <LoadingSkeleton />;

  return <Charts {...props} />;
}