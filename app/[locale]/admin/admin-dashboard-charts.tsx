"use client";

import {useState, useEffect, useCallback} from "react";
import {
  Users,
  Lightbulb,
  Gift,
  Landmark,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  HandHeart,
  MessageCircle,
  Activity,
  DollarSign,
  Clock,
  BarChart3,
  Bell,
  Shield,
  Settings,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import type {
  AdminDashboardKPI,
  AdminUserGrowthPoint,
  AdminVolunteerMonth,
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

const RED = "#ed2124";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";
const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";
const TEAL = "#14b8a6";
const PINK = "#ec4899";
const ORANGE = "#f97316";

const kpiConfig: {icon: LucideIcon; color: string}[] = [
  {icon: Users, color: RED},
  {icon: Activity, color: AMBER},
  {icon: Lightbulb, color: EMERALD},
  {icon: Gift, color: BLUE},
  {icon: HandHeart, color: PURPLE},
  {icon: Users, color: TEAL},
  {icon: Landmark, color: PINK},
  {icon: MessageCircle, color: ORANGE},
];

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function CountUp({value, locale, duration = 800}: {value: number; locale: string; duration?: number}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor(p * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");
  return <>{fmt(display)}</>;
}

function computeTrend(series: {value: number}[]): {value: string; direction: "up" | "down" | "flat"} {
  if (series.length < 2) return {value: "\u2014", direction: "flat"};
  const half = Math.floor(series.length / 2);
  const recent = series.slice(half).reduce((s, d) => s + d.value, 0);
  const prior = series.slice(0, half).reduce((s, d) => s + d.value, 0);
  if (prior === 0 && recent === 0) return {value: "0%", direction: "flat"};
  if (prior === 0) return {value: "+100%", direction: "up"};
  const pct = ((recent - prior) / prior) * 100;
  const abs = Math.abs(pct);
  if (abs < 0.5) return {value: "0%", direction: "flat"};
  return {value: pct > 0 ? `+${abs.toFixed(1)}%` : `-${abs.toFixed(1)}%`, direction: pct > 0 ? "up" : "down"};
}

type GrowthTab = "users" | "ideas" | "graatek" | "donations" | "volunteers";

function greeting(locale: string, name: string) {
  const h = new Date().getHours();
  if (locale === "ar") return h < 12 ? `صباح الخير، ${name}` : h < 17 ? `مساء الخير، ${name}` : `مساء الخير، ${name}`;
  if (locale === "fr") return h < 12 ? `Bonjour, ${name}` : h < 17 ? `Bon apr\u00e8s-midi, ${name}` : `Bonsoir, ${name}`;
  return h < 12 ? `Good morning, ${name}` : h < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`;
}

function formattedDate(locale: string) {
  const d = new Date();
  const opt: Intl.DateTimeFormatOptions = {weekday: "long", day: "numeric", month: "long", year: "numeric"};
  const l = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  return d.toLocaleDateString(l, opt);
}

export default function AdminDashboardCharts({
  kpis,
  userGrowth,
  ideaGrowth,
  graatekGrowth,
  volunteerActivity,
  donationTrend,
  conversationTrend,
  paymentMethods,
  hourlyActivity,
  realtimeActivity,
  health,
  labels,
  locale,
}: {
  kpis: AdminDashboardKPI[];
  userGrowth: AdminUserGrowthPoint[];
  ideaGrowth: AdminUserGrowthPoint[];
  graatekGrowth: AdminUserGrowthPoint[];
  volunteerActivity: AdminVolunteerMonth[];
  donationTrend: AdminDonationTrend[];
  conversationTrend: AdminConversationTrend[];
  paymentMethods: AdminPaymentMethod[];
  hourlyActivity: AdminHourlyPoint[];
  realtimeActivity: AdminRealtimeActivity[];
  health: AdminHealthIndicators;
  labels: Labels;
  locale: string;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [key, setKey] = useState(0);
  const [growthTab, setGrowthTab] = useState<GrowthTab>("users");

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setKey((k) => k + 1);
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const fmt = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");

  const fmtCurrency = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency", currency: "MRU", minimumFractionDigits: 0, maximumFractionDigits: 0,
    });

  const growthDataMap: Record<GrowthTab, AdminUserGrowthPoint[]> = {
    users: userGrowth,
    ideas: ideaGrowth,
    graatek: graatekGrowth,
    donations: donationTrend.map((d) => ({month: d.month, value: d.value})),
    volunteers: volunteerActivity,
  };
  const growthTabLabels: Record<GrowthTab, string> = {
    users: labels.usersTab, ideas: labels.ideasTab, graatek: labels.graatekTab,
    donations: labels.donationsTab, volunteers: labels.volunteersTab,
  };
  const growthTabColors: Record<GrowthTab, string> = {
    users: RED, ideas: AMBER, graatek: EMERALD, donations: BLUE, volunteers: PURPLE,
  };
  const growthData = growthDataMap[growthTab];
  const growthEmpty = growthData.length === 0 || growthData.every((d) => d.value === 0);
  const growthColor = growthTabColors[growthTab];
  const totalGrowth = growthData.reduce((s, d) => s + d.value, 0);

  const donutColors = [RED, AMBER, EMERALD, BLUE, PURPLE, TEAL];
  const paymentMethodsEmpty = paymentMethods.length === 0;
  const hourlyEmpty = hourlyActivity.length === 0 || hourlyActivity.every((h) => h.value === 0);
  const conversationEmpty = conversationTrend.length === 0 || conversationTrend.every((d) => d.value === 0);
  const realtimeEmpty = realtimeActivity.length === 0;
  const volunteerEmpty = volunteerActivity.length === 0 || volunteerActivity.every((d) => d.value === 0);
  const volunteerTotal = volunteerActivity.reduce((s, d) => s + d.value, 0);

  const kpiTrends = [
    computeTrend(userGrowth), computeTrend(userGrowth),
    computeTrend(ideaGrowth), computeTrend(graatekGrowth),
    computeTrend(donationTrend), computeTrend(volunteerActivity),
    computeTrend(donationTrend), computeTrend(conversationTrend),
  ];

  const TrendIcon = ({trend}: {trend: {value: string; direction: string}}) => {
    if (trend.direction === "up") return <TrendingUp size={12} />;
    if (trend.direction === "down") return <TrendingDown size={12} />;
    return <Minus size={12} />;
  };

  const healthItems = [
    {label: "DAU", value: fmt(health.dau), sub: `${Math.round((health.dau / Math.max(1, health.mau)) * 100)}% of MAU`, color: RED},
    {label: "MAU", value: fmt(health.mau), sub: `${health.engagementRate}% of total users`, color: BLUE},
    {label: labels.posts, value: fmt(health.postsToday), sub: labels.newToday.replace("{count}", fmt(health.postsToday)), color: EMERALD},
    {label: labels.ideas, value: fmt(health.ideasToday), sub: labels.newToday.replace("{count}", fmt(health.ideasToday)), color: AMBER},
    {label: labels.memories, value: fmt(health.memoriesToday), sub: labels.newToday.replace("{count}", fmt(health.memoriesToday)), color: PURPLE},
    {label: labels.members, value: fmt(health.newMembersToday), sub: labels.totalComments.replace("{count}", fmt(health.totalComments)), color: TEAL},
  ];

  const quickActions = [
    {icon: Bell, label: "Send Notification", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", href: "/admin/notifications"},
    {icon: Shield, label: "Review Reports", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", href: "/admin/moderation"},
    {icon: Settings, label: "Site Settings", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", href: "/admin/settings"},
    {icon: Users, label: "Add Admin", color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400", href: "/admin/users"},
    {icon: Sparkles, label: "Feature Content", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", href: "/admin/ideas"},
    {icon: Landmark, label: "Verify Payments", color: "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400", href: "/admin/payments"},
  ];

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.25} /><stop offset="100%" stopColor={RED} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} /><stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PURPLE} stopOpacity={0.25} /><stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ORANGE} stopOpacity={0.25} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} /><stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <div key={key} className="space-y-10">

        {/* ── Section 1: Welcome Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.eyebrow}</p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {greeting(locale, labels.adminName)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground/70">{formattedDate(locale)}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <span className="hidden text-[11px] text-muted-foreground/50 sm:block">
              Updated {timeAgo(lastUpdated.toISOString())}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Section 2: KPI Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.slice(0, 8).map((kpi, i) => {
            const {icon: Icon, color} = kpiConfig[i];
            const trend = kpiTrends[i];
            return (
              <a key={kpi.label} href={kpi.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{backgroundColor: `${color}15`, color}}>
                    <Icon size={18} />
                  </div>
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trend.direction === "up" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : trend.direction === "down" ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                    <TrendIcon trend={trend} />{trend.value}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                  {kpi.label === "donationsThisMonth" ? <>{fmtCurrency(kpi.value)}</> : <CountUp value={kpi.value} locale={locale} />}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{labels.kpi[kpi.label] ?? kpi.label}</p>
              </a>
            );
          })}
        </div>

        {/* ── Section 3: Community Growth Chart ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.growthRate}</p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">{labels.communityGrowth}</h2>
            </div>
            {!growthEmpty && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">+{fmt(totalGrowth)} total</span>
            )}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-4 flex gap-1">
              {(["users", "ideas", "graatek", "donations", "volunteers"] as GrowthTab[]).map((tab) => (
                <button key={tab} onClick={() => setGrowthTab(tab)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    growthTab === tab
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >{growthTabLabels[tab]}</button>
              ))}
            </div>
            <div className="h-72">
              {growthEmpty ? (
                <div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">{labels.noData}</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{top: 8, right: 8, bottom: 0, left: -16}}>
                    <defs><linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={growthColor} stopOpacity={0.2} /><stop offset="100%" stopColor={growthColor} stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="month" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13}} />
                    <Area type="monotone" dataKey="value" stroke={growthColor} strokeWidth={2.5} fill="url(#growthGrad)" dot={false} activeDot={{r: 5, fill: growthColor}} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 4: Community Health Indicators ── */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.healthEyebrow}</p>
            <h2 className="mt-0.5 text-xl font-black text-foreground">{labels.healthTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {healthItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-card p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1.5 text-2xl font-black" style={{color: item.color}}>{item.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/60">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5+6: Donations & Volunteer side by side ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donations Snapshot */}
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.byCampaign}</p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">Donations Snapshot</h2>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Monthly trend &amp; payment methods</span>
                {!paymentMethodsEmpty && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {fmt(paymentMethods.reduce((s, p) => s + p.count, 0))} donations
                  </span>
                )}
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="h-52">
                  {paymentMethodsEmpty ? (
                    <div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">{labels.noData}</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethods.map((pm) => ({name: pm.method, value: pm.total}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2}>
                          {paymentMethods.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13}} formatter={(value) => fmtCurrency(Number(value ?? 0))} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-3">
                  {!paymentMethodsEmpty && paymentMethods.slice(0, 5).map((pm) => (
                    <div key={pm.method} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: donutColors[paymentMethods.indexOf(pm) % donutColors.length]}} />
                        <span className="capitalize text-muted-foreground">{pm.method}</span>
                      </span>
                      <span className="font-bold text-foreground">{fmtCurrency(pm.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Volunteer Snapshot */}
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.successRate}</p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">Volunteer Snapshot</h2>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Monthly volunteer activity</span>
                {!volunteerEmpty && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{fmt(volunteerTotal)} total</span>
                )}
              </div>
              <div className="h-64">
                {volunteerEmpty ? (
                  <div className="flex h-full items-center justify-center"><p className="text-sm text-muted-foreground">{labels.noData}</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volunteerActivity} margin={{top: 8, right: 8, bottom: 0, left: -16}}>
                      <defs><linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={TEAL} stopOpacity={0.2} /><stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                      <XAxis dataKey="month" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13}} />
                      <Area type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2.5} fill="url(#volGrad)" dot={false} activeDot={{r: 5, fill: TEAL}} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── Section 7: Realtime Activity Feed ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{labels.realtimeActivity}</p>
              <h2 className="mt-0.5 text-xl font-black text-foreground">Live Feed</h2>
            </div>
            {!realtimeEmpty && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Last 5 minutes</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            {realtimeEmpty ? (
              <div className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <Zap size={28} className="mx-auto text-muted-foreground/20" />
                  <p className="mt-2 text-sm text-muted-foreground">{labels.noData}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
                {realtimeActivity.slice(0, 12).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-border/40 px-3 py-3 last:border-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {item.type === "donation" ? <DollarSign size={14} /> : item.type === "member" ? <Users size={14} /> : <MessageCircle size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground/60">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 8: Quick Actions ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h2 className="text-xl font-black text-foreground">Quick Actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a key={action.label} href={action.href}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-5 text-center transition hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold text-foreground">{action.label}</span>
                </a>
              );
            })}
          </div>
        </section>

      </div>
    </>
  );
}