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
  weeklyTrend: string;
  monthlyTrend: string;
  completionRate: string;
  dailyMessages: string;
  realtimeActivity: string;
  growthRate: string;
  successRate: string;
  engagementRate: string;
  noData: string;
  eyebrow: string;
  commandCenter: string;
  heroDescription: string;
}

const CHART_RED = "#ed2124";
const CHART_AMBER = "#f59e0b";
const CHART_EMERALD = "#10b981";
const CHART_BLUE = "#3b82f6";
const CHART_PURPLE = "#8b5cf6";
const CHART_TEAL = "#14b8a6";
const CHART_PINK = "#ec4899";
const CHART_ORANGE = "#f97316";

const kpiConfig: {icon: LucideIcon; color: string}[] = [
  {icon: Users, color: CHART_RED},
  {icon: Activity, color: CHART_AMBER},
  {icon: Lightbulb, color: CHART_EMERALD},
  {icon: Gift, color: CHART_BLUE},
  {icon: HandHeart, color: CHART_PURPLE},
  {icon: Users, color: CHART_TEAL},
  {icon: Landmark, color: CHART_PINK},
  {icon: MessageCircle, color: CHART_ORANGE},
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
  const formatted = pct > 0 ? `+${abs.toFixed(1)}%` : `-${abs.toFixed(1)}%`;
  if (abs < 0.5) return {value: "0%", direction: "flat"};
  return {value: formatted, direction: pct > 0 ? "up" : "down"};
}

type GrowthTab = "users" | "ideas" | "graatek" | "donations" | "volunteers";

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

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");

  const fmtCurrency = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "MRU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const growthDataMap: Record<GrowthTab, AdminUserGrowthPoint[]> = {
    users: userGrowth,
    ideas: ideaGrowth,
    graatek: graatekGrowth,
    donations: donationTrend.map((d) => ({month: d.month, value: d.value})),
    volunteers: volunteerActivity,
  };

  const growthTabLabels: Record<GrowthTab, string> = {
    users: labels.usersTab,
    ideas: labels.ideasTab,
    graatek: labels.graatekTab,
    donations: labels.donationsTab,
    volunteers: labels.volunteersTab,
  };

  const growthTabColors: Record<GrowthTab, string> = {
    users: CHART_RED,
    ideas: CHART_AMBER,
    graatek: CHART_EMERALD,
    donations: CHART_BLUE,
    volunteers: CHART_PURPLE,
  };

  const growthData = growthDataMap[growthTab];
  const growthEmpty = growthData.length === 0 || growthData.every((d) => d.value === 0);
  const growthColor = growthTabColors[growthTab];

  const paymentMethodsEmpty = paymentMethods.length === 0;
  const pmColors = [CHART_BLUE, CHART_EMERALD, CHART_AMBER, CHART_PURPLE, CHART_RED, CHART_TEAL];

  const hourlyEmpty = hourlyActivity.length === 0 || hourlyActivity.every((h) => h.value === 0);
  const conversationEmpty = conversationTrend.length === 0 || conversationTrend.every((d) => d.value === 0);
  const realtimeEmpty = realtimeActivity.length === 0;

  const kpiTrends = [
    computeTrend(userGrowth),
    computeTrend(userGrowth),
    computeTrend(ideaGrowth),
    computeTrend(graatekGrowth),
    computeTrend(donationTrend),
    computeTrend(volunteerActivity),
    computeTrend(donationTrend),
    computeTrend(conversationTrend),
  ];

  const TrendIcon = ({trend}: {trend: {value: string; direction: string}}) => {
    if (trend.direction === "up") return <TrendingUp size={12} />;
    if (trend.direction === "down") return <TrendingDown size={12} />;
    return <Minus size={12} />;
  };

  const totalGrowth = growthData.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_RED} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_RED} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_PURPLE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_PURPLE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_ORANGE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_ORANGE} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.eyebrow}</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {labels.commandCenter}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{labels.heroDescription}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-muted-foreground/50 sm:block">
            Updated {timeAgo(lastUpdated.toISOString())}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      <div key={key} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.slice(0, 8).map((kpi, i) => {
            const {icon: Icon, color} = kpiConfig[i];
            const trend = kpiTrends[i];
            return (
              <a
                key={kpi.label}
                href={kpi.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{backgroundColor: `${color}15`, color}}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      trend.direction === "up"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : trend.direction === "down"
                          ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <TrendIcon trend={trend} />
                    {trend.value}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-foreground">
                  {kpi.label === "donationsThisMonth" ? (
                    <>{fmtCurrency(kpi.value)}</>
                  ) : (
                    <CountUp value={kpi.value} locale={locale} />
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{labels.kpi[kpi.label] ?? kpi.label}</p>
              </a>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.growthRate}</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">{labels.communityGrowth}</h2>
              </div>
              {!growthEmpty && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  +{fmt(totalGrowth)}
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-1">
              {(["users", "ideas", "graatek", "donations", "volunteers"] as GrowthTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGrowthTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    growthTab === tab
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {growthTabLabels[tab]}
                </button>
              ))}
            </div>
            <div className="mt-3 h-56">
              {growthEmpty ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{labels.noData}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{top: 4, right: 4, bottom: 0, left: -16}}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={growthColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={growthColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={growthColor}
                      strokeWidth={2}
                      fill="url(#growthGrad)"
                      dot={false}
                      activeDot={{r: 4, fill: growthColor}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.hourlyActivity}</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">Messages Today</h2>
              </div>
              {!hourlyEmpty && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>24h</span>
                </div>
              )}
            </div>
            <div className="mt-5 h-44">
              {hourlyEmpty ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{labels.noData}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivity} margin={{top: 4, right: 4, bottom: 0, left: -16}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="hour" tick={{fontSize: 9}} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="value" fill={CHART_ORANGE} radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.dailyMessages}</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">Conversation Volume</h2>
              </div>
              {!conversationEmpty && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {fmt(conversationTrend.reduce((s, d) => s + d.value, 0))}
                </span>
              )}
            </div>
            <div className="mt-5 h-52">
              {conversationEmpty ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{labels.noData}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversationTrend} margin={{top: 4, right: 4, bottom: 0, left: -16}}>
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_PURPLE} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_PURPLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={CHART_PURPLE}
                      strokeWidth={2}
                      fill="url(#convGrad)"
                      dot={false}
                      activeDot={{r: 4, fill: CHART_PURPLE}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.byCampaign}</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">{labels.donationMethods}</h2>
              </div>
              {!paymentMethodsEmpty && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {fmt(paymentMethods.reduce((s, p) => s + p.count, 0))}
                </span>
              )}
            </div>
            <div className="mt-5 h-52">
              {paymentMethodsEmpty ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{labels.noData}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods.map((pm) => ({name: pm.method, value: pm.total}))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={66}
                      paddingAngle={2}
                    >
                      {paymentMethods.map((_, i) => (
                        <Cell key={i} fill={pmColors[i % pmColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(value) => fmtCurrency(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {!paymentMethodsEmpty && (
              <div className="mt-3 space-y-1.5">
                {paymentMethods.slice(0, 4).map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{backgroundColor: pmColors[paymentMethods.indexOf(pm) % pmColors.length]}} />
                      <span className="capitalize text-muted-foreground">{pm.method}</span>
                    </span>
                    <span className="font-semibold text-foreground">{fmtCurrency(pm.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.realtimeActivity}</p>
                <h2 className="mt-0.5 text-lg font-black text-foreground">Live Feed</h2>
              </div>
              {!realtimeEmpty && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <div className="mt-5">
              {realtimeEmpty ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={24} className="mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">{labels.noData}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {realtimeActivity.slice(0, 8).map((item, idx) => (
                    <div key={item.id} className="group grid grid-cols-[auto_1fr] gap-3 transition">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {item.type === "donation" ? <DollarSign size={13} /> : item.type === "member" ? <Users size={13} /> : <MessageCircle size={13} />}
                        </div>
                        {idx < Math.min(realtimeActivity.length, 8) - 1 && (
                          <div className="h-5 w-px bg-border/60" />
                        )}
                      </div>
                      <div className="min-w-0 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground/60">
                            {timeAgo(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}