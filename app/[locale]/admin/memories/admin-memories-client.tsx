"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {
  Archive, ArrowUpDown, BarChart3, BookOpen, Calendar,
  Download, Edit3, Eye, Filter, Heart, Image as ImageIcon, Layers3, LineChart,
  MapPin, MessageCircle, Pin, Search, ShieldAlert, Sparkles, Star,
  Trash2, TrendingUp, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {AdminAvatar, GlassCard, displayName} from "@/components/admin/admin-shared";
import {AdminExportDropdown, type ExportColumn} from "@/components/admin/admin-export-dropdown";

type ProfileSummary = {id: string; full_name: string | null; username: string | null; avatar_url: string | null};
type Labels = Record<string, string>;
type PeriodKey = "today" | "7d" | "30d" | "90d" | "1y" | "all";

export interface MemoryMediaSummary {
  id: string;
  memory_id: string;
  url: string | null;
  type: string;
  created_at: string;
}

export interface AdminMemoryItem {
  id: string;
  contributor_id: string | null;
  title: string;
  description: string | null;
  content_language: string | null;
  decade: string | null;
  year: number | null;
  location: string | null;
  category: string | null;
  media_url: string | null;
  media_type: string;
  verification_status: string;
  tags: string[];
  shares_count: number;
  reactions_count: number;
  comments_count: number;
  saves_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  contributor: ProfileSummary | null;
  media: MemoryMediaSummary[];
  is_featured: boolean;
}

const COLORS = ["#ed2124", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const PERIODS: {key: PeriodKey; labelKey: string; days: number | null}[] = [
  {key: "today", labelKey: "periodToday", days: 1},
  {key: "7d", labelKey: "period7d", days: 7},
  {key: "30d", labelKey: "period30d", days: 30},
  {key: "90d", labelKey: "period90d", days: 90},
  {key: "1y", labelKey: "period1y", days: 365},
  {key: "all", labelKey: "periodAll", days: null},
];

const STATUS_STYLES: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  needs_more_info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  featured: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  archived: "border-muted bg-muted/30 text-muted-foreground",
  hidden: "border-muted bg-muted/30 text-muted-foreground",
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  history: "categoryHistory",
  culture: "categoryCulture",
  fishing: "categoryFishing",
  education: "categoryEducation",
  sports: "categorySports",
  community: "categoryCommunity",
  festivals: "categoryFestivals",
  architecture: "categoryArchitecture",
  other: "categoryOther",
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

function inPeriod(date: string, period: PeriodKey) {
  const selected = PERIODS.find((item) => item.key === period);
  if (!selected?.days) return true;
  return Date.now() - new Date(date).getTime() <= selected.days * 86400000;
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function categoryLabel(category: string | null, labels: Labels) {
  if (!category) return labels.uncategorized;
  const labelKey = CATEGORY_LABEL_KEYS[category];
  if (labelKey && labels[labelKey]) return labels[labelKey];
  return category.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function statusLabel(memory: AdminMemoryItem, labels: Labels) {
  if (memory.is_featured) return labels.featured;
  if (memory.verification_status === "approved") return labels.published;
  if (memory.verification_status === "needs_more_info") return labels.needsMoreInfo;
  return labels[memory.verification_status] ?? memory.verification_status;
}

function getCoverUrl(memory: AdminMemoryItem) {
  return memory.media.find((item) => item.url)?.url ?? memory.media_url;
}

function periodLabel(memory: AdminMemoryItem, labels: Labels) {
  return memory.decade ?? (memory.year ? String(memory.year) : labels.noPeriod);
}

function trendValue(items: AdminMemoryItem[], predicate: (item: AdminMemoryItem) => boolean = () => true) {
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

function buildTimeSeries(items: AdminMemoryItem[], period: PeriodKey) {
  const groups = new Map<string, {label: string; published: number; reactions: number; comments: number; saves: number}>();
  for (const item of items.filter((memory) => inPeriod(memory.created_at, period))) {
    const date = new Date(item.created_at);
    const label = period === "today"
      ? date.toLocaleTimeString([], {hour: "2-digit"})
      : date.toLocaleDateString([], {month: "short", day: "numeric"});
    const current = groups.get(label) ?? {label, published: 0, reactions: 0, comments: 0, saves: 0};
    current.published += 1;
    current.reactions += item.reactions_count;
    current.comments += item.comments_count;
    current.saves += item.saves_count;
    groups.set(label, current);
  }
  return Array.from(groups.values()).slice(-18);
}

function aggregateCategories(items: AdminMemoryItem[], labels: Labels) {
  const map = new Map<string, {key: string; category: string; count: number; reactions: number; comments: number; views: number}>();
  for (const item of items) {
    const key = item.category ?? "other";
    const current = map.get(key) ?? {key, category: categoryLabel(key, labels), count: 0, reactions: 0, comments: 0, views: 0};
    current.count += 1;
    current.reactions += item.reactions_count;
    current.comments += item.comments_count;
    current.views += item.views_count;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function aggregatePeriods(items: AdminMemoryItem[], labels: Labels) {
  const map = new Map<string, {period: string; count: number; engagement: number}>();
  for (const item of items) {
    const key = periodLabel(item, labels);
    const current = map.get(key) ?? {period: key, count: 0, engagement: 0};
    current.count += 1;
    current.engagement += item.reactions_count + item.comments_count + item.saves_count + item.shares_count;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function contributorStats(items: AdminMemoryItem[]) {
  const map = new Map<string, {profile: ProfileSummary | null; count: number; engagement: number}>();
  for (const item of items) {
    const key = item.contributor?.id ?? "unknown";
    const current = map.get(key) ?? {profile: item.contributor, count: 0, engagement: 0};
    current.count += 1;
    current.engagement += item.reactions_count + item.comments_count + item.saves_count + item.shares_count;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.engagement - a.engagement).slice(0, 6);
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

export function AdminMemoriesClient({
  initialMemories,
  labels,
  locale,
}: {
  initialMemories: AdminMemoryItem[];
  labels: Labels;
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedMemory, setSelectedMemory] = useState<AdminMemoryItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const timeSeries = useMemo(() => buildTimeSeries(initialMemories, period), [initialMemories, period]);
  const categoryOptions = useMemo(() => aggregateCategories(initialMemories, labels), [initialMemories, labels]);
  const periodOptions = useMemo(() => aggregatePeriods(initialMemories, labels), [initialMemories, labels]);

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = [...initialMemories];
    if (query) {
      result = result.filter((memory) => (
        memory.title.toLowerCase().includes(query) ||
        memory.description?.toLowerCase().includes(query) ||
        categoryLabel(memory.category, labels).toLowerCase().includes(query) ||
        periodLabel(memory, labels).toLowerCase().includes(query) ||
        memory.location?.toLowerCase().includes(query) ||
        memory.contributor?.full_name?.toLowerCase().includes(query) ||
        memory.contributor?.username?.toLowerCase().includes(query)
      ));
    }
    if (status === "featured") result = result.filter((memory) => memory.is_featured);
    else if (status) result = result.filter((memory) => memory.verification_status === status);
    if (category) result = result.filter((memory) => (memory.category ?? "other") === category);
    if (periodFilter) result = result.filter((memory) => periodLabel(memory, labels) === periodFilter);
    if (quickFilter === "featured") result = result.filter((memory) => memory.is_featured);
    if (quickFilter === "most_viewed") result.sort((a, b) => b.views_count - a.views_count);
    if (quickFilter === "most_commented") result.sort((a, b) => b.comments_count - a.comments_count);
    if (quickFilter === "recently_published") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    result.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "title") cmp = a.title.localeCompare(b.title);
      else if (sortColumn === "category") cmp = (a.category ?? "").localeCompare(b.category ?? "");
      else if (sortColumn === "period") cmp = periodLabel(a, labels).localeCompare(periodLabel(b, labels));
      else if (sortColumn === "views") cmp = a.views_count - b.views_count;
      else if (sortColumn === "comments") cmp = a.comments_count - b.comments_count;
      else if (sortColumn === "reactions") cmp = a.reactions_count - b.reactions_count;
      else if (sortColumn === "status") cmp = statusLabel(a, labels).localeCompare(statusLabel(b, labels));
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [initialMemories, labels, search, status, category, periodFilter, quickFilter, sortColumn, sortDir]);

  const total = initialMemories.length;
  const newThisMonth = initialMemories.filter((memory) => inPeriod(memory.created_at, "30d")).length;
  const featuredCount = initialMemories.filter((memory) => memory.is_featured).length;
  const totalViews = initialMemories.reduce((sum, memory) => sum + memory.views_count, 0);
  const totalReactions = initialMemories.reduce((sum, memory) => sum + memory.reactions_count, 0);
  const totalComments = initialMemories.reduce((sum, memory) => sum + memory.comments_count, 0);
  const coverageScore = percent(new Set(initialMemories.map((memory) => periodLabel(memory, labels)).filter((value) => value !== labels.noPeriod)).size, 8);
  const growthRate = trendValue(initialMemories);
  const sparkline = timeSeries.length ? timeSeries.map((item) => ({value: item.published + item.reactions + item.comments + item.saves})) : [{value: 0}, {value: 0}];
  const pieData = categoryOptions.slice(0, 7).map((item, index) => ({name: item.category, value: item.count, fill: COLORS[index % COLORS.length]}));
  const engagementByCategory = categoryOptions.slice(0, 8).map((item) => ({...item, engagement: item.reactions + item.comments}));
  const topViewed = [...initialMemories].sort((a, b) => b.views_count - a.views_count).slice(0, 5);
  const oldest = [...initialMemories].filter((memory) => memory.year).sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))[0] ?? null;
  const mostPreservedPeriod = periodOptions[0]?.period ?? labels.noPeriod;
  const contributors = contributorStats(initialMemories);

  const exportColumns = useMemo<ExportColumn<AdminMemoryItem>[]>(() => [
    {header: labels.tableTitle, getValue: (memory) => memory.title},
    {header: labels.tableCategory, getValue: (memory) => categoryLabel(memory.category, labels)},
    {header: labels.tableAuthor, getValue: (memory) => memory.contributor ? displayName(memory.contributor) : labels.unknown},
    {header: labels.tablePeriod, getValue: (memory) => periodLabel(memory, labels)},
    {header: labels.tableViews, getValue: (memory) => memory.views_count},
    {header: labels.tableComments, getValue: (memory) => memory.comments_count},
    {header: labels.tableReactions, getValue: (memory) => memory.reactions_count},
    {header: labels.tableStatus, getValue: (memory) => statusLabel(memory, labels)},
    {header: labels.tablePublished, getValue: (memory) => formatDate(memory.created_at, locale)},
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
      if (event.key === "Escape") setSelectedMemory(null);
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
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.eyebrow}</p>
              <h1 className="text-2xl font-black text-foreground">{labels.title}</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{labels.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
              <Star size={15} />
              {labels.featureMemory}
            </button>
            <AdminExportDropdown labels={labels} rows={filteredMemories} columns={exportColumns} filename="admin-memories" title={labels.title} />
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
              <Filter size={15} />
              {labels.filters}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={labels.totalMemories} value={formatNumber(total, locale)} trend={growthRate} icon={BookOpen} data={sparkline} />
        <KpiCard label={labels.newThisMonth} value={formatNumber(newThisMonth, locale)} trend={trendValue(initialMemories, (memory) => inPeriod(memory.created_at, "30d"))} icon={TrendingUp} data={sparkline} color="#2563eb" />
        <KpiCard label={labels.featuredMemories} value={formatNumber(featuredCount, locale)} trend={trendValue(initialMemories, (memory) => memory.is_featured)} icon={Star} data={sparkline} color="#8b5cf6" />
        <KpiCard label={labels.totalViews} value={formatNumber(totalViews, locale)} trend={growthRate} icon={Eye} data={sparkline} color="#10b981" />
        <KpiCard label={labels.totalReactions} value={formatNumber(totalReactions, locale)} trend={growthRate} icon={Heart} data={sparkline} color="#ec4899" />
        <KpiCard label={labels.totalComments} value={formatNumber(totalComments, locale)} trend={growthRate} icon={MessageCircle} data={sparkline} color="#f59e0b" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === item.key ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            {labels[item.labelKey] ?? item.labelKey}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.publishedOverTime}</h2>
            <LineChart size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{top: 10, right: 8, bottom: 0, left: -20}}>
                <defs>
                  <linearGradient id="memoriesPublished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed2124" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ed2124" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="published" stroke="#ed2124" strokeWidth={2} fill="url(#memoriesPublished)" />
                <Area type="monotone" dataKey="reactions" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.08} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.communityEngagement}</h2>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} margin={{top: 10, right: 8, bottom: 0, left: -20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="comments" radius={[6, 6, 0, 0]} fill="#2563eb" />
                <Bar dataKey="saves" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.heritageAnalytics}</h2>
            <Layers3 size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementByCategory} margin={{top: 10, right: 8, bottom: 0, left: -20}} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" tick={{fontSize: 10}} tickLine={false} axisLine={false} width={96} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#ed2124" />
                <Bar dataKey="engagement" radius={[0, 6, 6, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-foreground">{labels.historicalPeriods}</h2>
            <Calendar size={16} className="text-muted-foreground" />
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
              {periodOptions.slice(0, 6).map((item, index) => (
                <div key={item.period} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.period}</span>
                  <span className="font-black text-foreground">{formatNumber(item.count, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.heritageInsights}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label={labels.oldestPublished} value={oldest ? `${oldest.year}` : "-"} />
            <StatPill label={labels.mostPreservedPeriod} value={mostPreservedPeriod} />
            <StatPill label={labels.contentGrowthRate} value={growthRate} />
            <StatPill label={labels.coverageScore} value={`${coverageScore}%`} />
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.engagementAnalytics}</h2>
          <div className="mt-4 space-y-3">
            {topViewed.map((memory) => (
              <button key={memory.id} onClick={() => setSelectedMemory(memory)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Eye size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{memory.title}</span>
                  <span className="text-xs text-muted-foreground">{formatNumber(memory.views_count, locale)} {labels.tableViews}</span>
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.topContributors}</h2>
          <div className="mt-4 space-y-3">
            {contributors.map((item) => (
              <div key={item.profile?.id ?? "unknown"} className="flex items-center gap-3 rounded-xl p-2">
                <AdminAvatar profile={item.profile} className="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{item.profile ? displayName(item.profile) : labels.unknown}</span>
                  <span className="text-xs text-muted-foreground">{formatNumber(item.count, locale)} {labels.totalMemories}</span>
                </span>
                <span className="text-xs font-black text-primary">{formatNumber(item.engagement, locale)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0" hover={false}>
        <div className="border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-foreground">{labels.directory}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatNumber(filteredMemories.length, locale)} / {formatNumber(total, locale)}</p>
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
                <option value="approved">{labels.published}</option>
                <option value="featured">{labels.featured}</option>
                <option value="pending">{labels.pending}</option>
                <option value="rejected">{labels.rejected}</option>
                <option value="needs_more_info">{labels.needsMoreInfo}</option>
              </select>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">{labels.allCategories}</option>
                {categoryOptions.map((item) => <option key={item.key} value={item.key}>{item.category}</option>)}
              </select>
              <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">{labels.allPeriods}</option>
                {periodOptions.map((item) => <option key={item.period} value={item.period}>{item.period}</option>)}
              </select>
              <select value={quickFilter} onChange={(event) => setQuickFilter(event.target.value)} className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm">
                <option value="">{labels.filters}</option>
                <option value="featured">{labels.featured}</option>
                <option value="most_viewed">{labels.mostViewed}</option>
                <option value="most_commented">{labels.mostCommented}</option>
                <option value="recently_published">{labels.recentlyPublished}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="w-14 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tableCover}</th>
                <th className="px-4 py-3 text-left"><button onClick={() => handleSort("title")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableTitle}<ArrowUpDown size={12} /></button></th>
                <th className="hidden px-4 py-3 text-left lg:table-cell"><button onClick={() => handleSort("category")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableCategory}<ArrowUpDown size={12} /></button></th>
                <th className="hidden px-4 py-3 text-left lg:table-cell text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tableAuthor}</th>
                <th className="hidden px-4 py-3 text-left xl:table-cell"><button onClick={() => handleSort("period")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tablePeriod}<ArrowUpDown size={12} /></button></th>
                <th className="px-4 py-3 text-right"><button onClick={() => handleSort("views")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableViews}<ArrowUpDown size={12} /></button></th>
                <th className="hidden px-4 py-3 text-right md:table-cell"><button onClick={() => handleSort("comments")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableComments}<ArrowUpDown size={12} /></button></th>
                <th className="hidden px-4 py-3 text-right md:table-cell"><button onClick={() => handleSort("reactions")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableReactions}<ArrowUpDown size={12} /></button></th>
                <th className="px-4 py-3 text-left"><button onClick={() => handleSort("status")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">{labels.tableStatus}<ArrowUpDown size={12} /></button></th>
                <th className="hidden px-4 py-3 text-left xl:table-cell text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tablePublished}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemories.map((memory) => {
                const cover = getCoverUrl(memory);
                return (
                  <tr key={memory.id} onClick={() => setSelectedMemory(memory)} className="cursor-pointer border-b border-border/30 transition hover:bg-muted/20">
                    <td className="px-4 py-3">
                      {cover ? <img src={cover} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ImageIcon size={16} /></span>}
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate font-bold text-foreground">{memory.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{memory.description ?? memory.location ?? "-"}</p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground">{categoryLabel(memory.category, labels)}</span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex items-center gap-2">
                        <AdminAvatar profile={memory.contributor} className="h-7 w-7" />
                        <span className="max-w-[140px] truncate text-xs font-semibold text-muted-foreground">{memory.contributor ? displayName(memory.contributor) : labels.unknown}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">{periodLabel(memory, labels)}</td>
                    <td className="px-4 py-3 text-right font-black text-foreground">{formatNumber(memory.views_count, locale)}</td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">{formatNumber(memory.comments_count, locale)}</td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">{formatNumber(memory.reactions_count, locale)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${memory.is_featured ? STATUS_STYLES.featured : STATUS_STYLES[memory.verification_status] ?? STATUS_STYLES.hidden}`}>
                        {statusLabel(memory, labels)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">{formatDate(memory.created_at, locale)}</td>
                  </tr>
                );
              })}
              {filteredMemories.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
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
          <h2 className="text-base font-black text-foreground">{labels.featuredSection}</h2>
          <div className="mt-4 space-y-3">
            {initialMemories.filter((memory) => memory.is_featured).slice(0, 5).map((memory) => (
              <button key={memory.id} onClick={() => setSelectedMemory(memory)} className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 text-left transition hover:bg-muted/50">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{memory.title}</span>
                <Star size={14} className="shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.collections}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[labels.collectionHistory, labels.collectionFishing, labels.collectionSchools, labels.collectionLeaders, labels.collectionMarkets, labels.collectionCelebrations].map((collection) => (
              <div key={collection} className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm font-bold text-foreground">
                {collection}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover={false}>
          <h2 className="text-base font-black text-foreground">{labels.reports}</h2>
          <div className="mt-4 space-y-2">
            {[labels.reportMostViewed, labels.reportCommunityEngagement, labels.reportHistoricalCategories, labels.reportTopContributors].map((report) => (
              <div key={report} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 p-3">
                <span className="text-sm font-semibold text-foreground">{report}</span>
                <Download size={15} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMemory(null)} />
          <div ref={panelRef} className="relative flex w-full max-w-xl flex-col overflow-y-auto bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur-md">
              <h2 className="text-base font-black text-foreground">{labels.detailTitle}</h2>
              <button onClick={() => setSelectedMemory(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {getCoverUrl(selectedMemory) ? <img src={getCoverUrl(selectedMemory) ?? ""} alt="" className="h-56 w-full rounded-2xl object-cover" /> : null}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen size={19} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-foreground">{selectedMemory.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedMemory.description ?? "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground">{categoryLabel(selectedMemory.category, labels)}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${selectedMemory.is_featured ? STATUS_STYLES.featured : STATUS_STYLES[selectedMemory.verification_status] ?? STATUS_STYLES.hidden}`}>
                      {statusLabel(selectedMemory, labels)}
                    </span>
                  </div>
                </div>
              </div>

              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <AdminAvatar profile={selectedMemory.contributor} className="h-10 w-10" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedMemory.contributor ? displayName(selectedMemory.contributor) : labels.unknown}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {selectedMemory.location ?? "-"}</p>
                  </div>
                </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-3">
                <StatPill label={labels.tableViews} value={formatNumber(selectedMemory.views_count, locale)} />
                <StatPill label={labels.tableComments} value={formatNumber(selectedMemory.comments_count, locale)} />
                <StatPill label={labels.tableReactions} value={formatNumber(selectedMemory.reactions_count, locale)} />
                <StatPill label={labels.shares} value={formatNumber(selectedMemory.shares_count, locale)} />
                <StatPill label={labels.bookmarks} value={formatNumber(selectedMemory.saves_count, locale)} />
                <StatPill label={labels.tablePeriod} value={periodLabel(selectedMemory, labels)} />
                <StatPill label={labels.publicationDate} value={formatDate(selectedMemory.created_at, locale)} />
                <StatPill label={labels.gallery} value={formatNumber(selectedMemory.media.length + (selectedMemory.media_url ? 1 : 0), locale)} />
              </div>

              <GlassCard className="p-4" hover={false}>
                <h3 className="text-sm font-black text-foreground">{labels.featuredSection}</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Star size={14} />{labels.feature}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Pin size={14} />{labels.pinHome}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Sparkles size={14} />{labels.highlightFeed}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Layers3 size={14} />{labels.createCollection}</button>
                </div>
              </GlassCard>

              <GlassCard className="p-4" hover={false}>
                <h3 className="text-sm font-black text-foreground">{labels.moderation}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Edit3 size={14} />{labels.edit}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><Archive size={14} />{labels.archive}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-bold transition hover:bg-muted/50"><ShieldAlert size={14} />{labels.reviewReports}</button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><Trash2 size={14} />{labels.delete}</button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
