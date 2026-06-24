"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {
  Activity, Archive, ArrowUpDown, BarChart3, Box, CheckCircle2,
  Download, Eye, Filter, Gift, HeartHandshake, LineChart, Map as MapIcon,
  PackageCheck, Search, ShieldAlert, Trash2, TrendingUp, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {AdminAvatar, GlassCard, displayName} from "@/components/admin/admin-shared";
import {AdminExportDropdown, type ExportColumn} from "@/components/admin/admin-export-dropdown";

type ProfileSummary = {id: string; full_name: string | null; username: string | null; avatar_url: string | null};

export interface GraatekRequest {
  id: string;
  share_id: string;
  requester_id: string;
  message: string | null;
  status: string;
  collected_at: string | null;
  handed_over_at: string | null;
  created_at: string;
  updated_at: string;
  requester: ProfileSummary | null;
}

export interface GraatekAdminItem {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  location: string | null;
  status: string;
  images: unknown[];
  shares_count: number;
  accepted_request_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
  receiver_confirmed_at: string | null;
  sender_confirmed_at: string | null;
  owner: ProfileSummary | null;
  requests: GraatekRequest[];
  accepted_request: GraatekRequest | null;
  requests_count: number;
  pending_requests: number;
  rejected_requests: number;
  messages_count: number;
  views_count: number;
}

type Labels = Record<string, string>;
type PeriodKey = "today" | "7d" | "30d" | "90d" | "1y" | "all";

const COLORS = ["#ed2124", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const PERIODS: {key: PeriodKey; label: string; days: number | null}[] = [
  {key: "today", label: "Today", days: 1},
  {key: "7d", label: "7 Days", days: 7},
  {key: "30d", label: "30 Days", days: 30},
  {key: "90d", label: "90 Days", days: 90},
  {key: "1y", label: "1 Year", days: 365},
  {key: "all", label: "All Time", days: null},
];

const STATUS_STYLES: Record<string, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  requested: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  reserved: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  collected: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  given: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  archived: "border-muted bg-muted/30 text-muted-foreground",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

function formatNumber(value: number, locale: string) {
  return value.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(status: string) {
  if (status === "active" || status === "available") return "published";
  if (status === "given") return "completed";
  return status;
}

function statusLabel(status: string, labels: Labels) {
  const normalized = normalizeStatus(status);
  if (normalized === "published") return labels.available ?? "Available";
  return labels[normalized] ?? normalized;
}

function categoryLabel(category: string) {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getImageUrl(images: unknown[]) {
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const record = first as Record<string, unknown>;
    if (typeof record.url === "string") return record.url;
    if (typeof record.publicUrl === "string") return record.publicUrl;
    if (typeof record.src === "string") return record.src;
  }
  return null;
}

function inPeriod(date: string, period: PeriodKey) {
  const selected = PERIODS.find((item) => item.key === period);
  if (!selected?.days) return true;
  return Date.now() - new Date(date).getTime() <= selected.days * 86400000;
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function trendValue(items: GraatekAdminItem[], predicate: (item: GraatekAdminItem) => boolean = () => true) {
  const now = Date.now();
  const current = items.filter((item) => predicate(item) && now - new Date(item.created_at).getTime() <= 30 * 86400000).length;
  const previous = items.filter((item) => {
    const age = now - new Date(item.created_at).getTime();
    return predicate(item) && age > 30 * 86400000 && age <= 60 * 86400000;
  }).length;
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function buildTimeSeries(items: GraatekAdminItem[], period: PeriodKey) {
  const filtered = items.filter((item) => inPeriod(item.created_at, period));
  const groups = new Map<string, {label: string; created: number; completed: number; requests: number}>();
  for (const item of filtered) {
    const date = new Date(item.created_at);
    const label = period === "today"
      ? date.toLocaleTimeString([], {hour: "2-digit"})
      : date.toLocaleDateString([], {month: "short", day: "numeric"});
    const current = groups.get(label) ?? {label, created: 0, completed: 0, requests: 0};
    current.created += 1;
    current.requests += item.requests_count;
    if (normalizeStatus(item.status) === "completed") current.completed += 1;
    groups.set(label, current);
  }
  return Array.from(groups.values()).slice(-18);
}

function aggregateCategories(items: GraatekAdminItem[]) {
  const map = new Map<string, {category: string; shared: number; requested: number; completed: number; available: number}>();
  for (const item of items) {
    const key = categoryLabel(item.category || "other");
    const current = map.get(key) ?? {category: key, shared: 0, requested: 0, completed: 0, available: 0};
    current.shared += 1;
    current.requested += item.requests_count;
    if (normalizeStatus(item.status) === "completed") current.completed += 1;
    if (normalizeStatus(item.status) === "published") current.available += 1;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.shared - a.shared);
}

function averageCompletionDays(items: GraatekAdminItem[]) {
  const completed = items.filter((item) => item.completed_at);
  if (!completed.length) return 0;
  const total = completed.reduce((sum, item) => {
    return sum + Math.max(0, new Date(item.completed_at as string).getTime() - new Date(item.created_at).getTime()) / 86400000;
  }, 0);
  return Math.round((total / completed.length) * 10) / 10;
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  data,
  color = "#ed2124",
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  data: {value: number}[];
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={19} />
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${trend.startsWith("-") ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {trend}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-3 h-9">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top: 0, right: 0, bottom: 0, left: 0}}>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatPill({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-black text-foreground">{value}</p>
    </div>
  );
}

export function AdminGraatekClient({
  initialItems,
  labels,
  locale,
}: {
  initialItems: GraatekAdminItem[];
  labels: Labels;
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedItem, setSelectedItem] = useState<GraatekAdminItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => aggregateCategories(initialItems), [initialItems]);
  const timeSeries = useMemo(() => buildTimeSeries(initialItems, period), [initialItems, period]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = [...initialItems];
    if (query) {
      result = result.filter((item) => (
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        categoryLabel(item.category).toLowerCase().includes(query) ||
        item.owner?.full_name?.toLowerCase().includes(query) ||
        item.owner?.username?.toLowerCase().includes(query)
      ));
    }
    if (status) result = result.filter((item) => normalizeStatus(item.status) === status);
    if (category) result = result.filter((item) => item.category === category);
    if (quickFilter === "most_requested") result.sort((a, b) => b.requests_count - a.requests_count);
    if (quickFilter === "recently_created") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (quickFilter === "completed") result = result.filter((item) => normalizeStatus(item.status) === "completed");
    if (quickFilter === "available") result = result.filter((item) => normalizeStatus(item.status) === "published");
    result.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "title") cmp = a.title.localeCompare(b.title);
      else if (sortColumn === "category") cmp = a.category.localeCompare(b.category);
      else if (sortColumn === "status") cmp = normalizeStatus(a.status).localeCompare(normalizeStatus(b.status));
      else if (sortColumn === "requests") cmp = a.requests_count - b.requests_count;
      else if (sortColumn === "views") cmp = a.views_count - b.views_count;
      else if (sortColumn === "completed_at") cmp = new Date(a.completed_at ?? 0).getTime() - new Date(b.completed_at ?? 0).getTime();
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [initialItems, search, status, category, quickFilter, sortColumn, sortDir]);

  const total = initialItems.length;
  const availableCount = initialItems.filter((item) => normalizeStatus(item.status) === "published").length;
  const requestedCount = initialItems.filter((item) => normalizeStatus(item.status) === "requested").length;
  const reservedCount = initialItems.filter((item) => ["reserved", "collected"].includes(normalizeStatus(item.status))).length;
  const completedCount = initialItems.filter((item) => normalizeStatus(item.status) === "completed").length;
  const helpedCount = new Set(initialItems.filter((item) => normalizeStatus(item.status) === "completed").map((item) => item.accepted_request?.requester_id).filter(Boolean)).size;
  const completionRate = percent(completedCount, Math.max(1, completedCount + availableCount + requestedCount + reservedCount));
  const avgCompletion = averageCompletionDays(initialItems);

  const sparkline = timeSeries.length ? timeSeries.map((item) => ({value: item.created + item.completed + item.requests})) : [{value: 0}, {value: 0}];
  const demandData = categoryOptions.map((item) => ({...item, shortage: Math.max(0, item.requested - item.available)})).sort((a, b) => b.requested - a.requested).slice(0, 8);
  const pieData = categoryOptions.slice(0, 6).map((item, index) => ({name: item.category, value: item.shared, fill: COLORS[index % COLORS.length]}));
  const mostRequested = [...initialItems].sort((a, b) => b.requests_count - a.requests_count).slice(0, 5);
  const shortages = demandData.filter((item) => item.shortage > 0).slice(0, 5);
  const unfulfilled = initialItems.filter((item) => item.requests_count > 0 && !item.accepted_request && normalizeStatus(item.status) !== "completed").slice(0, 5);

  const exportColumns = useMemo<ExportColumn<GraatekAdminItem>[]>(() => [
    {header: labels.tableTitle ?? "Title", getValue: (item) => item.title},
    {header: labels.tableCategory ?? "Category", getValue: (item) => categoryLabel(item.category)},
    {header: labels.tableOwner ?? "Owner", getValue: (item) => item.owner ? displayName(item.owner) : "Unknown"},
    {header: labels.tableStatus ?? "Status", getValue: (item) => statusLabel(item.status, labels)},
    {header: labels.tableRequests ?? "Requests", getValue: (item) => item.requests_count},
    {header: labels.tableViews ?? "Views", getValue: (item) => item.views_count},
    {header: labels.pendingRequests ?? "Pending Requests", getValue: (item) => item.pending_requests},
    {header: labels.rejectedRequests ?? "Rejected Requests", getValue: (item) => item.rejected_requests},
    {header: labels.tableCreated ?? "Created Date", getValue: (item) => formatDate(item.created_at, locale)},
    {header: labels.tableCompleted ?? "Completion Date", getValue: (item) => formatDate(item.completed_at, locale)},
  ], [labels, locale]);

  const handleSort = (column: string) => {
    if (sortColumn === column) setSortDir((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortColumn(column);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Gift size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.eyebrow}</p>
              <h1 className="text-2xl font-black text-foreground">{labels.title}</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{labels.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminExportDropdown labels={labels} rows={filteredItems} columns={exportColumns} filename="admin-graatek" title={labels.title ?? "Graatek"} />
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
              <Filter size={15} />
              {labels.filters}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={labels.totalItems} value={formatNumber(total, locale)} trend={trendValue(initialItems)} icon={Gift} data={sparkline} />
        <KpiCard label={labels.activeListings} value={formatNumber(availableCount, locale)} trend={trendValue(initialItems, (item) => normalizeStatus(item.status) === "published")} icon={Box} data={sparkline} color="#10b981" />
        <KpiCard label={labels.successfulExchanges} value={formatNumber(completedCount, locale)} trend={trendValue(initialItems, (item) => normalizeStatus(item.status) === "completed")} icon={HeartHandshake} data={sparkline} color="#2563eb" />
        <KpiCard label={labels.reservedItems} value={formatNumber(reservedCount, locale)} trend={trendValue(initialItems, (item) => ["reserved", "collected"].includes(normalizeStatus(item.status)))} icon={PackageCheck} data={sparkline} color="#8b5cf6" />
        <KpiCard label={labels.completionRate} value={`${completionRate}%`} trend={`${completionRate}%`} icon={TrendingUp} data={sparkline} color="#f59e0b" />
        <KpiCard label={labels.peopleHelped} value={formatNumber(helpedCount, locale)} trend={trendValue(initialItems, (item) => Boolean(item.accepted_request))} icon={Users} data={sparkline} color="#ec4899" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === item.key ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.createdOverTime}</h2>
            <LineChart size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{top: 10, right: 8, bottom: 0, left: -20}}>
                <defs>
                  <linearGradient id="graatekCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed2124" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ed2124" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="created" stroke="#ed2124" strokeWidth={2} fill="url(#graatekCreated)" />
                <Area type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.08} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.successfulExchangesChart}</h2>
            <CheckCircle2 size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} margin={{top: 10, right: 8, bottom: 0, left: -20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="completed" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.categoryGrowth}</h2>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData} margin={{top: 10, right: 8, bottom: 0, left: -20}} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" tick={{fontSize: 10}} tickLine={false} axisLine={false} width={96} />
                <Tooltip />
                <Bar dataKey="shared" radius={[0, 6, 6, 0]} fill="#ed2124" />
                <Bar dataKey="requested" radius={[0, 6, 6, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.communityDemand}</h2>
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-48 shrink-0 sm:w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {demandData.slice(0, 6).map((item, index) => (
                <div key={item.category} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.category}</span>
                  <span className="font-black text-foreground">{formatNumber(item.requested, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.impact}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label={labels.peopleHelped} value={formatNumber(helpedCount, locale)} />
            <StatPill label={labels.successfulExchanges} value={formatNumber(completedCount, locale)} />
            <StatPill label={labels.totalItems} value={formatNumber(total, locale)} />
            <StatPill label={labels.avgTime} value={`${avgCompletion}d`} />
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.needs}</h2>
          <div className="mt-4 space-y-3">
            {mostRequested.map((item) => (
              <button key={item.id} onClick={() => setSelectedItem(item)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Gift size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{formatNumber(item.requests_count, locale)} {labels.tableRequests}</span>
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.futureMap}</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 text-center">
            <MapIcon className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm font-bold text-foreground">Neighborhood heat map ready</p>
            <p className="mt-1 text-xs text-muted-foreground">Location fields are preserved for future city demand analytics.</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0" hover={false}>
        <div className="border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-foreground">{labels.directory}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatNumber(filteredItems.length, locale)} / {formatNumber(total, locale)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 lg:flex-none">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={labels.search}
                  className="h-10 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">{labels.allStatuses}</option>
                <option value="published">{labels.available}</option>
                <option value="requested">{labels.requested}</option>
                <option value="reserved">{labels.reserved}</option>
                <option value="completed">{labels.completed}</option>
                <option value="archived">{labels.archived}</option>
              </select>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">{labels.allCategories}</option>
                {categoryOptions.map((item) => <option key={item.category} value={item.category.toLowerCase().replaceAll(" ", "_")}>{item.category}</option>)}
              </select>
              <select value={quickFilter} onChange={(event) => setQuickFilter(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">Smart filters</option>
                <option value="most_requested">Most Requested</option>
                <option value="recently_created">Recently Created</option>
                <option value="completed">{labels.completed}</option>
                <option value="available">{labels.available}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="w-14 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tableImage}</th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort("title")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableTitle}<ArrowUpDown size={12} /></button>
                </th>
                <th className="hidden px-4 py-3 text-left lg:table-cell">
                  <button onClick={() => handleSort("category")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableCategory}<ArrowUpDown size={12} /></button>
                </th>
                <th className="hidden px-4 py-3 text-left lg:table-cell text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tableOwner}</th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort("status")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableStatus}<ArrowUpDown size={12} /></button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button onClick={() => handleSort("requests")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableRequests}<ArrowUpDown size={12} /></button>
                </th>
                <th className="hidden px-4 py-3 text-right md:table-cell">
                  <button onClick={() => handleSort("views")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableViews}<ArrowUpDown size={12} /></button>
                </th>
                <th className="hidden px-4 py-3 text-left xl:table-cell">
                  <button onClick={() => handleSort("created_at")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableCreated}<ArrowUpDown size={12} /></button>
                </th>
                <th className="hidden px-4 py-3 text-left xl:table-cell">
                  <button onClick={() => handleSort("completed_at")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableCompleted}<ArrowUpDown size={12} /></button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const imageUrl = getImageUrl(item.images);
                return (
                  <tr key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer border-b border-border/30 transition hover:bg-muted/20">
                    <td className="px-4 py-3">
                      {imageUrl ? <img src={imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gift size={16} /></span>}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="truncate font-bold text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.description ?? item.location ?? "-"}</p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground">{categoryLabel(item.category)}</span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex items-center gap-2">
                        <AdminAvatar profile={item.owner} className="h-7 w-7" />
                        <span className="max-w-[140px] truncate text-xs font-semibold text-muted-foreground">{item.owner ? displayName(item.owner) : "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[normalizeStatus(item.status)] ?? STATUS_STYLES.archived}`}>
                        {statusLabel(item.status, labels)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-foreground">{formatNumber(item.requests_count, locale)}</td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">{formatNumber(item.views_count, locale)}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">{formatDate(item.created_at, locale)}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">{formatDate(item.completed_at, locale)}</td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Gift className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-muted-foreground">{labels.noResults}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.reports}</h2>
          <div className="mt-4 space-y-2">
            {["Most Shared Categories", "Monthly Sharing", "Community Impact", "Successful Exchanges"].map((report) => (
              <div key={report} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-3">
                <span className="text-sm font-semibold text-foreground">{report}</span>
                <Download size={15} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">Shortages</h2>
          <div className="mt-4 space-y-3">
            {shortages.length ? shortages.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                <span className="text-sm font-semibold text-foreground">{item.category}</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-300">{formatNumber(item.shortage, locale)}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No shortage signals yet.</p>}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">Unfulfilled items</h2>
          <div className="mt-4 space-y-3">
            {unfulfilled.length ? unfulfilled.map((item) => (
              <button key={item.id} onClick={() => setSelectedItem(item)} className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 text-left transition hover:bg-muted/50">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{item.title}</span>
                <span className="text-xs font-bold text-muted-foreground">{formatNumber(item.pending_requests, locale)}</span>
              </button>
            )) : <p className="text-sm text-muted-foreground">No unfulfilled requests.</p>}
          </div>
        </GlassCard>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div ref={panelRef} className="relative flex w-full max-w-xl flex-col overflow-y-auto bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur-md">
              <h2 className="text-base font-black text-foreground">{labels.detailTitle}</h2>
              <button onClick={() => setSelectedItem(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {getImageUrl(selectedItem.images) ? <img src={getImageUrl(selectedItem.images) ?? ""} alt="" className="h-56 w-full rounded-2xl object-cover" /> : null}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gift size={19} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-foreground">{selectedItem.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedItem.description ?? "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground">{categoryLabel(selectedItem.category)}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[normalizeStatus(selectedItem.status)] ?? STATUS_STYLES.archived}`}>
                      {statusLabel(selectedItem.status, labels)}
                    </span>
                  </div>
                </div>
              </div>

              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <AdminAvatar profile={selectedItem.owner} className="h-10 w-10" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedItem.owner ? displayName(selectedItem.owner) : "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.location ?? selectedItem.condition ?? "-"}</p>
                  </div>
                </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-3">
                <StatPill label={labels.tableViews} value={formatNumber(selectedItem.views_count, locale)} />
                <StatPill label={labels.tableRequests} value={formatNumber(selectedItem.requests_count, locale)} />
                <StatPill label={labels.acceptedRequest} value={selectedItem.accepted_request ? displayName(selectedItem.accepted_request.requester) : "-"} />
                <StatPill label="Messages" value={formatNumber(selectedItem.messages_count, locale)} />
                <StatPill label={labels.tableCreated} value={formatDate(selectedItem.created_at, locale)} />
                <StatPill label={labels.tableCompleted} value={formatDate(selectedItem.completed_at, locale)} />
              </div>

              <GlassCard className="p-4" hover={false}>
                <h3 className="text-sm font-black text-foreground">Request management</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatPill label={labels.pendingRequests} value={formatNumber(selectedItem.pending_requests, locale)} />
                  <StatPill label={labels.acceptedRequest} value={selectedItem.accepted_request ? "1" : "0"} />
                  <StatPill label={labels.rejectedRequests} value={formatNumber(selectedItem.rejected_requests, locale)} />
                </div>
                <div className="mt-4 space-y-2">
                  {selectedItem.requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                      <AdminAvatar profile={request.requester} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{request.requester ? displayName(request.requester) : "Unknown"}</p>
                        <p className="truncate text-xs text-muted-foreground">{request.message ?? request.status}</p>
                      </div>
                      <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold text-muted-foreground">{request.status}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4" hover={false}>
                <h3 className="text-sm font-black text-foreground">{labels.moderation}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Eye size={14} />{labels.viewListing}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Archive size={14} />{labels.archive}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><Trash2 size={14} />{labels.remove}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"><ShieldAlert size={14} />{labels.investigate}</button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
