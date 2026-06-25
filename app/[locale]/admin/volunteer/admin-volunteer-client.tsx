"use client";

import {useMemo, useState} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  HandHeart,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";

import {adminSetSupportContributionStatusAction} from "@/app/[locale]/server-actions";
import {AdminAvatar, GlassCard, StatusBadge} from "@/components/admin/admin-shared";
import {AdminExportDropdown} from "@/components/admin/admin-export-dropdown";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import type {SupportCampaign, SupportDonationStatus} from "@/lib/data/support";

type Labels = Record<string, string>;

export type AdminVolunteerRequest = {
  id: string;
  campaign_id: string;
  contributor_id: string | null;
  volunteer_message: string | null;
  status: SupportDonationStatus;
  created_at: string;
  updated_at: string;
  campaign: {
    id: string;
    slug: string;
    emoji: string;
    title: string;
    status: string;
    volunteers_count: number;
    last_update_at: string;
  } | null;
  contributor: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type Props = {
  locale: string;
  status: string | null;
  labels: Labels;
  campaigns: SupportCampaign[];
  requests: AdminVolunteerRequest[];
};

const colors = ["#ef4444", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US").format(value);
}

function profileName(profile: AdminVolunteerRequest["contributor"], fallback: string) {
  return profile?.full_name ?? profile?.username ?? fallback;
}

function campaignTitle(campaign: Pick<SupportCampaign, "slug" | "title"> | AdminVolunteerRequest["campaign"], labels: Labels) {
  if (!campaign) return labels.notAvailable;
  const mapped: Record<string, string | undefined> = {
    water: labels.campaignWater,
    education: labels.campaignEducation,
    families: labels.campaignFamilies,
    "clean-nouadhibou": labels.campaignClean,
    health: labels.campaignHealth,
  };
  return mapped[campaign.slug] ?? campaign.title;
}

function categoryFor(campaign: Pick<SupportCampaign, "slug"> | AdminVolunteerRequest["campaign"], labels: Labels) {
  if (!campaign) return labels.categoryCommunity;
  if (campaign.slug === "clean-nouadhibou") return labels.categoryEnvironment;
  if (campaign.slug === "education") return labels.categoryEducation;
  if (campaign.slug === "families") return labels.categoryFamilies;
  if (campaign.slug === "health") return labels.categoryHealth;
  if (campaign.slug === "water") return labels.categoryCommunity;
  return labels.categoryYouthSports;
}

function requestStatusLabel(labels: Labels, status: string) {
  const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return labels[key] ?? status;
}

function statusClass(status: string) {
  if (status === "verified") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "rejected") return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  if (status === "refunded") return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function progressFor(campaign: SupportCampaign) {
  const needed = Math.max(12, Math.ceil(campaign.goal_amount / 5000));
  return Math.min(100, Math.round((campaign.volunteers_count / needed) * 100));
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  icon: typeof UsersRound;
  tone: string;
}) {
  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600">
          <TrendingUp size={12} />
          {trend}
        </span>
      </div>
      <p className="mt-5 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      <div className="mt-4 flex h-8 items-end gap-1">
        {[38, 44, 31, 56, 62, 49, 78, 70, 88].map((height, index) => (
          <span key={index} className="flex-1 rounded-t-full bg-primary/20" style={{height: `${height}%`}} />
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminVolunteerClient({locale, status, labels, campaigns, requests}: Props) {
  const [timeFilter, setTimeFilter] = useState("days30");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(requests[0]?.id ?? null);
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const approvedRequests = requests.filter((request) => request.status === "verified");
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active");
  const completedCampaigns = campaigns.filter((campaign) => campaign.status === "completed");
  const totalVolunteers = campaigns.reduce((sum, campaign) => sum + campaign.volunteers_count, 0);
  const estimatedHours = approvedRequests.length * 4 + completedCampaigns.length * 36 + totalVolunteers * 2;
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null;

  const trend = useMemo(() => {
    return Array.from({length: 6}, (_item, index) => ({
      month: new Date(2026, index, 1).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {month: "short"}),
      volunteers: Math.max(0, Math.round(totalVolunteers * (0.35 + index * 0.13))),
      hours: Math.max(8, Math.round(estimatedHours * (0.2 + index * 0.12))),
    }));
  }, [estimatedHours, locale, totalVolunteers]);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const campaign of campaigns) {
      const category = categoryFor(campaign, labels);
      grouped.set(category, (grouped.get(category) ?? 0) + Math.max(1, campaign.volunteers_count));
    }
    return Array.from(grouped.entries()).map(([name, value]) => ({name, value}));
  }, [campaigns, labels]);

  const activeCompletedData = [
    {name: labels.statusOpen, value: activeCampaigns.length},
    {name: labels.statusCompleted, value: completedCampaigns.length},
    {name: labels.statusArchived, value: campaigns.filter((campaign) => campaign.status === "paused").length},
  ].filter((item) => item.value > 0);

  const statusMessage = status
    ? labels[`status${status.replace(/^donation-/, "volunteer-").replace(/(^|-)(\w)/g, (_match, _dash, char) => char.toUpperCase())}`]
    : null;

  const filters = [
    {value: "today", label: labels.today},
    {value: "days7", label: labels.days7},
    {value: "days30", label: labels.days30},
    {value: "days90", label: labels.days90},
    {value: "year1", label: labels.year1},
    {value: "allTime", label: labels.allTime},
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
      <GlassCard className="p-5 md:p-6" hover={false}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-3 gap-1 rounded-full">
              <ShieldCheck size={14} />
              {labels.eyebrow}
            </Badge>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{labels.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">{labels.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusMessage ? (
              <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">{statusMessage}</span>
            ) : null}
            <AdminExportDropdown
              title={labels.exportTitle}
              filename="volunteering-management"
              rows={campaigns}
              columns={[
                {header: labels.opportunity, getValue: (campaign) => campaignTitle(campaign, labels)},
                {header: labels.category, getValue: (campaign) => categoryFor(campaign, labels)},
                {header: labels.volunteersJoined, getValue: (campaign) => campaign.volunteers_count},
                {header: labels.status, getValue: (campaign) => campaign.status},
              ]}
              labels={labels}
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label={labels.totalVolunteers} value={formatNumber(totalVolunteers, locale)} trend="+14.2%" icon={UsersRound} tone="bg-primary/10 text-primary" />
        <KpiCard label={labels.activeOpportunities} value={formatNumber(activeCampaigns.length, locale)} trend="+6.0%" icon={HandHeart} tone="bg-emerald-500/10 text-emerald-600" />
        <KpiCard label={labels.pendingApplications} value={formatNumber(pendingRequests.length, locale)} trend="+3.5%" icon={Clock3} tone="bg-amber-500/10 text-amber-600" />
        <KpiCard label={labels.completedActivities} value={formatNumber(completedCampaigns.length, locale)} trend="+8.7%" icon={CheckCircle2} tone="bg-green-500/10 text-green-600" />
        <KpiCard label={labels.volunteerHours} value={formatNumber(estimatedHours, locale)} trend="+11.8%" icon={ListChecks} tone="bg-blue-500/10 text-blue-600" />
        <KpiCard label={labels.monthlyGrowth} value="21.4%" trend="+4.1%" icon={TrendingUp} tone="bg-violet-500/10 text-violet-600" />
      </div>

      <GlassCard className="p-4 md:p-5" hover={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{labels.analytics}</p>
            <h2 className="text-xl font-black">{labels.volunteerGrowthOverTime}</h2>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-border/60 bg-muted/40 p-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setTimeFilter(filter.value)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  timeFilter === filter.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="volunteerGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="volunteers" name={labels.totalVolunteers} stroke="#ef4444" strokeWidth={3} fill="url(#volunteerGrowth)" />
                <Area type="monotone" dataKey="hours" name={labels.volunteerHoursByMonth} stroke="#0ea5e9" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
              <h3 className="text-sm font-black">{labels.opportunitiesByCategory}</h3>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={4}>
                      {categoryData.map((_entry, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
              <h3 className="text-sm font-black">{labels.completedVsActive}</h3>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activeCompletedData} dataKey="value" nameKey="name" outerRadius={70}>
                      {activeCompletedData.map((_entry, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaigns.map((campaign) => ({
              name: campaignTitle(campaign, labels),
              joined: campaign.volunteers_count,
              needed: Math.max(12, Math.ceil(campaign.goal_amount / 5000)),
            }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="joined" name={labels.volunteersJoined} fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="needed" name={labels.volunteersNeeded} fill="#fecaca" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <GlassCard className="p-4 md:p-5" hover={false}>
          <div className="mb-4">
            <h2 className="text-xl font-black">{labels.opportunitiesTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{labels.opportunitiesDescription}</p>
          </div>
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const needed = Math.max(12, Math.ceil(campaign.goal_amount / 5000));
              const progress = progressFor(campaign);
              return (
                <div key={campaign.id} className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{campaign.emoji}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black">{campaignTitle(campaign, labels)}</h3>
                            <StatusBadge status={campaign.status} label={campaign.status === "active" ? labels.statusOpen : campaign.status === "completed" ? labels.statusCompleted : labels.statusArchived} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{categoryFor(campaign, labels)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        <div>
                          <p className="text-xs text-muted-foreground">{labels.organizer}</p>
                          <p className="font-bold">I ❤️ NDB</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{labels.location}</p>
                          <p className="font-bold">Nouadhibou</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{labels.date}</p>
                          <p className="font-bold">{new Date(campaign.starts_at).toLocaleDateString(locale)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{labels.volunteersNeeded}</p>
                          <p className="font-bold">{needed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{labels.volunteersJoined}</p>
                          <p className="font-bold text-primary">{campaign.volunteers_count}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
                          <span>{labels.progress}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{width: `${progress}%`}} />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:w-48 lg:grid-cols-1">
                      <Button type="button" variant="outline" className="gap-2"><Eye size={16} />{labels.view}</Button>
                      <Button type="button" variant="outline" className="gap-2"><BadgeCheck size={16} />{labels.approve}</Button>
                      <Button type="button" variant="outline" className="gap-2"><FileText size={16} />{labels.export}</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-4 md:p-5" hover={false}>
            <div className="mb-4">
              <h2 className="text-xl font-black">{labels.applicationsTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{labels.applicationsDescription}</p>
            </div>
            <div className="space-y-3">
              {pendingRequests.length ? pendingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border/60 bg-background p-3">
                  <button type="button" onClick={() => setSelectedRequestId(request.id)} className="flex w-full items-start gap-3 text-start">
                    <AdminAvatar profile={request.contributor} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{profileName(request.contributor, labels.unknownVolunteer)}</p>
                      <p className="text-sm text-muted-foreground">{request.campaign?.emoji} {campaignTitle(request.campaign, labels)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{request.volunteer_message ?? labels.notAvailable}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(request.status)}`}>
                      {requestStatusLabel(labels, request.status)}
                    </span>
                  </button>
                  <div className="mt-3 grid gap-2">
                    <form action={adminSetSupportContributionStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="contributionId" value={request.id} />
                      <input type="hidden" name="nextStatus" value="verified" />
                      <input type="hidden" name="returnPath" value="/admin/volunteer" />
                      <input type="hidden" name="statusPrefix" value="volunteer" />
                      <Button type="submit" className="w-full gap-2"><CheckCircle2 size={16} />{labels.accept}</Button>
                    </form>
                    <div className="grid grid-cols-2 gap-2">
                      <form action={adminSetSupportContributionStatusAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="contributionId" value={request.id} />
                        <input type="hidden" name="nextStatus" value="rejected" />
                        <input type="hidden" name="returnPath" value="/admin/volunteer" />
                        <input type="hidden" name="statusPrefix" value="volunteer" />
                        <input type="hidden" name="rejectedReason" value="Rejected by volunteer manager" />
                        <Button type="submit" variant="outline" className="w-full gap-2 text-destructive"><Ban size={16} />{labels.reject}</Button>
                      </form>
                      <Button type="button" variant="outline" className="gap-2"><MessageCircle size={16} />{labels.messageApplicant}</Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{labels.noApplications}</div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4 md:p-5" hover={false}>
            <h2 className="text-xl font-black">{labels.profilesTitle}</h2>
            {selectedRequest ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <AdminAvatar profile={selectedRequest.contributor} className="h-14 w-14" />
                  <div>
                    <p className="font-black">{profileName(selectedRequest.contributor, labels.unknownVolunteer)}</p>
                    <p className="text-sm text-muted-foreground">@{selectedRequest.contributor?.username ?? labels.notAvailable}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {[
                    [labels.phone, labels.notAvailable],
                    [labels.language, labels.notAvailable],
                    [labels.joinedOpportunities, `${requests.filter((request) => request.contributor_id === selectedRequest.contributor_id).length}`],
                    [labels.completedActivitiesLabel, `${requests.filter((request) => request.contributor_id === selectedRequest.contributor_id && request.status === "verified").length}`],
                    [labels.totalHours, `${requests.filter((request) => request.contributor_id === selectedRequest.contributor_id && request.status === "verified").length * 4}`],
                    [labels.reliabilityScore, "92%"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-2xl bg-muted/30 p-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[labels.communityHelper, labels.cleanupVolunteer, labels.educationSupporter].map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <Star size={12} />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{labels.noApplications}</p>
            )}
          </GlassCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-4 md:p-5" hover={false}>
          <h2 className="text-xl font-black">{labels.attendanceTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.attendanceDescription}</p>
          <div className="mt-4 grid gap-3">
            {[
              [labels.attended, approvedRequests.length],
              [labels.absent, Math.max(0, Math.round(pendingRequests.length / 3))],
              [labels.late, Math.max(0, Math.round(approvedRequests.length / 5))],
              [labels.completedHours, estimatedHours],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-muted/30 p-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-black">{formatNumber(Number(value), locale)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-5" hover={false}>
          <h2 className="text-xl font-black">{labels.impactTitle}</h2>
          <div className="mt-4 grid gap-3">
            {[
              [labels.volunteerHours, estimatedHours],
              [labels.peopleHelped, totalVolunteers * 3],
              [labels.neighborhoodsServed, Math.max(3, activeCampaigns.length)],
              [labels.activitiesCompleted, completedCampaigns.length],
              [labels.activeOrganizers, Math.max(1, activeCampaigns.length)],
              [labels.recurringVolunteers, approvedRequests.length],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-muted/30 p-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-black">{formatNumber(Number(value), locale)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-5" hover={false}>
          <h2 className="text-xl font-black">{labels.organizersTitle}</h2>
          <div className="mt-4 space-y-3">
            {[labels.verifiedOrganizers, labels.createOpportunities, labels.manageVolunteers, labels.markAttendance, labels.publishUpdates, labels.reviewActivity].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
                <UserCheck size={18} className="text-emerald-600" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4 md:p-5" hover={false}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-black">{labels.updatesTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{labels.notificationsTitle}</p>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
            {labels.monthlyReport} · {labels.attendanceReport} · {labels.hoursReport} · {labels.opportunityReport}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
