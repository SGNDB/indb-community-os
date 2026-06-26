"use client";

import {useState, useMemo, useCallback, useEffect, useRef} from "react";

import {
  Lightbulb, TrendingUp, Users, CheckCircle, Sparkles, Star,
  Search, X, Filter, ArrowUpDown, MessageCircle,
  ChevronRight, Calendar, UserPlus,
  Edit3, Archive, Trash2,
  BarChart3, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePie, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import type {LucideIcon} from "lucide-react";

import {AdminAvatar, GlassCard, displayName} from "@/components/admin/admin-shared";
import {AdminExportDropdown, type ExportColumn} from "@/components/admin/admin-export-dropdown";
import type {AdminIdeaWithStats, AdminIdeasKPISummary} from "@/lib/data/admin";

const PIECHART_COLORS = ["#ed2124", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const STATUS_STYLES: Record<string, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  interested: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  discussion: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  archived: "border-muted bg-muted/30 text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Active",
  interested: "Interested",
  discussion: "Discussion",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

function formatNum(n: number, locale: string) {
  return n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}



function MiniSparkline({data, color = "#ed2124"}: {data: {value: number}[]; color?: string}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{top: 0, right: 0, bottom: 0, left: 0}}>
        <defs>
          <linearGradient id={`sgrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#sgrad-${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendBadge({value}: {value: string}) {
  const positive = !value.startsWith("-");
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>
      <TrendingUp size={10} className={positive ? "" : "rotate-180"} />
      {value}
    </span>
  );
}

function KpiCard({label, value, icon: Icon, trend, chart, color}: {
  label: string; value: string; icon: LucideIcon; trend?: string; chart?: React.ReactNode; color?: string;
}) {
  return (
    <GlassCard className="p-4" hover={false}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{backgroundColor: `${color ?? "#ed2124"}15`, color: color ?? "#ed2124"}}>
          <Icon size={18} />
        </div>
        {trend && <TrendBadge value={trend} />}
      </div>
      <p className="mt-3 text-2xl font-black text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {chart && <div className="mt-2">{chart}</div>}
    </GlassCard>
  );
}

function computeTrend(data: {value: number}[]): string {
  if (data.length < 2) return "0%";
  const mid = Math.floor(data.length / 2);
  const first = data.slice(0, mid).reduce((s, p) => s + p.value, 0);
  const second = data.slice(mid).reduce((s, p) => s + p.value, 0);
  if (first === 0 && second === 0) return "0%";
  if (first === 0) return "+100%";
  const change = ((second - first) / first) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function FiltersBar({filters, onChange, labels, onClear, categoryOptions}: {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  labels: Record<string, string>;
  onClear: () => void;
  categoryOptions: {name: string; count: number}[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
        <Filter size={15} />
        {labels.filterStatus ?? "Filters"}
        {Object.keys(filters).length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{Object.keys(filters).length}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-border/60 bg-card p-4 shadow-xl">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{labels.filterStatus}</label>
              <select value={filters.status ?? ""} onChange={(e) => onChange("status", e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="">{labels.allStatus}</option>
                <option value="active">{labels.active}</option>
                <option value="in_progress">{labels.inProgress}</option>
                <option value="completed">{labels.completed}</option>
                <option value="archived">{labels.archived}</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{labels.filterCategory}</label>
              <select value={filters.category ?? ""} onChange={(e) => onChange("category", e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="">{labels.allCategories}</option>
                {categoryOptions.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {key: "most_supported", label: labels.filterMostSupported},
                {key: "most_discussed", label: labels.filterMostDiscussed},
                {key: "recently_created", label: labels.filterRecentlyCreated},
                {key: "completed", label: labels.filterCompleted},
              ].map(({key, label}) => (
                <button key={key} onClick={() => onChange(key, filters[key] === "true" ? "" : "true")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filters[key] === "true" ? "bg-primary text-primary-foreground" : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >{label}</button>
              ))}
            </div>
            <button onClick={onClear} className="w-full rounded-xl border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/50">
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function IdeasClient({
  initialKpi, initialIdeas, topVoted, topSupported, mostDiscussed, labels, locale, initialSearch,
}: {
  initialKpi: AdminIdeasKPISummary;
  initialIdeas: AdminIdeaWithStats[];
  topVoted: AdminIdeaWithStats[];
  topSupported: AdminIdeaWithStats[];
  mostDiscussed: AdminIdeaWithStats[];
  labels: Record<string, string>;
  locale: string;
  initialSearch: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIdea, setSelectedIdea] = useState<AdminIdeaWithStats | null>(null);
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedIdea(null); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const displayedIdeas = useMemo(() => {
    let result = [...initialIdeas];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category_name?.toLowerCase().includes(q) ||
        i.author?.full_name?.toLowerCase().includes(q) ||
        i.author?.username?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      if (filters.status === "active") {
        result = result.filter(i => ["published", "interested", "discussion", "in_progress"].includes(i.status));
      } else {
        result = result.filter(i => i.status === filters.status);
      }
    }

    if (filters.category) {
      result = result.filter(i => i.category_name === filters.category);
    }

    if (filters.most_supported === "true") {
      result.sort((a, b) => b.supportPercentage - a.supportPercentage);
    }
    if (filters.most_discussed === "true") {
      result.sort((a, b) => b.comments_count - a.comments_count);
    }
    if (filters.recently_created === "true") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (filters.completed === "true") {
      result = result.filter(i => i.status === "completed");
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "title") cmp = a.title.localeCompare(b.title);
      else if (sortColumn === "votes") cmp = a.votes_count - b.votes_count;
      else if (sortColumn === "supporters") cmp = a.supporters_count - b.supporters_count;
      else if (sortColumn === "participants") cmp = a.participants_count - b.participants_count;
      else if (sortColumn === "messages") cmp = a.messages_count - b.messages_count;
      else if (sortColumn === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [initialIdeas, search, filters, sortColumn, sortDir]);

  const ideaExportColumns = useMemo<ExportColumn<AdminIdeaWithStats>[]>(() => [
    {header: labels.tableTitle ?? "Title", getValue: (idea) => idea.title},
    {header: labels.tableCategory ?? "Category", getValue: (idea) => idea.category_name ?? ""},
    {header: labels.tableCreator ?? "Creator", getValue: (idea) => idea.author ? displayName(idea.author) : ""},
    {header: labels.tableStatus ?? "Status", getValue: (idea) => labels[idea.status] ?? STATUS_LABEL[idea.status] ?? idea.status},
    {header: labels.tableVotes ?? "Votes", getValue: (idea) => idea.votes_count},
    {header: labels.tableSupporters ?? "Supporters", getValue: (idea) => idea.supporters_count},
    {header: labels.tableParticipants ?? "Participants", getValue: (idea) => idea.participants_count},
    {header: labels.tableMessages ?? "Messages", getValue: (idea) => idea.messages_count},
    {header: labels.tableCreated ?? "Created", getValue: (idea) => formatDate(idea.created_at, locale)},
    {header: labels.analyticsAvgSupport ?? "Support", getValue: (idea) => `${idea.supportPercentage}%`},
    {header: "Views", getValue: (idea) => idea.views},
    {header: "Description", getValue: (idea) => idea.description},
  ], [labels, locale]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDir("desc"); }
  };

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      const next = {...prev};
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch("");
  }, []);

  const categoryOptions = useMemo(() =>
    initialKpi.categoryDistribution.map(c => ({name: c.category, count: c.count})),
  [initialKpi]);

  const growthData = useMemo(() => {
    const months = initialKpi.monthlyGrowth;
    const days = initialKpi.dailyGrowth;
    if (analyticsPeriod === "7d") return days.slice(-7).map(d => ({value: d.value, label: d.month}));
    if (analyticsPeriod === "30d") return days.slice(-30).map(d => ({value: d.value, label: d.month}));
    if (analyticsPeriod === "90d") return days.slice(-90).map(d => ({value: d.value, label: d.month}));
    return months.map(d => ({value: d.value, label: d.month}));
  }, [analyticsPeriod, initialKpi]);

  const trendIdeas = computeTrend(initialKpi.monthlyGrowth);
  const isRtl = locale === "ar";
  const localeNum = (n: number) => formatNum(n, locale);

  const activeVsCompletedData = useMemo(() => {
    const active = initialIdeas.filter(i => ["published", "interested", "discussion", "in_progress"].includes(i.status)).length;
    const completed = initialIdeas.filter(i => i.status === "completed").length;
    const archived = initialIdeas.filter(i => i.status === "archived").length;
    return [
      {name: labels.active, value: active, fill: "#2563eb"},
      {name: labels.inProgress, value: initialIdeas.filter(i => i.status === "in_progress").length, fill: "#f59e0b"},
      {name: labels.completed, value: completed, fill: "#10b981"},
      {name: labels.archived, value: archived, fill: "#8b5cf6"},
    ];
  }, [initialIdeas, labels]);

  const voteSupportData = useMemo(() => {
    const top = [...initialIdeas].sort((a, b) => b.votes_count - a.votes_count).slice(0, 10);
    return top.map(i => ({title: i.title.length > 20 ? i.title.slice(0, 20) + "..." : i.title, votes: i.votes_count, supporters: i.supporters_count}));
  }, [initialIdeas]);

  return (
    <>
      {/* HEADER */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lightbulb size={22} /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.eyebrow}</p>
              <h1 className="text-2xl font-black text-foreground">{labels.title}</h1>
              <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{labels.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
              <Sparkles size={15} /> {labels.createFeatured}
            </button>
            <AdminExportDropdown
              labels={labels}
              rows={displayedIdeas}
              columns={ideaExportColumns}
              filename="admin-ideas"
              title={labels.title ?? "Ideas"}
            />
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={labels.kpiTotalIdeas} value={localeNum(initialKpi.totalIdeas)} trend={trendIdeas} icon={Lightbulb}
          chart={<MiniSparkline data={initialKpi.monthlyGrowth.map(m => ({value: m.value}))} />} />
        <KpiCard label={labels.kpiNewThisMonth} value={localeNum(initialKpi.newThisMonth)} icon={TrendingUp}
          chart={<MiniSparkline data={initialKpi.dailyGrowth.slice(-30).map(d => ({value: d.value}))} color="#3b82f6" />} color="#3b82f6" />
        <KpiCard label={labels.kpiActive} value={localeNum(initialKpi.activeIdeas)} icon={Activity}
          chart={<MiniSparkline data={initialKpi.dailyGrowth.slice(-14).map(d => ({value: d.value}))} color="#10b981" />} color="#10b981" />
        <KpiCard label={labels.kpiCompleted} value={localeNum(initialKpi.completedIdeas)} icon={CheckCircle}
          color="#8b5cf6" />
        <KpiCard label={labels.kpiParticipants} value={localeNum(initialKpi.totalParticipants)} icon={Users}
          chart={<MiniSparkline data={initialKpi.monthlyGrowth.map(m => ({value: Math.max(0, m.value - 1)}))} color="#f59e0b" />} color="#f59e0b" />
        <KpiCard label={labels.kpiAvgSupport} value={`${initialKpi.avgSupportScore}%`} icon={Star}
          color="#ec4899" />
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-muted/30 p-0.5">
          {[
            {key: "7d", label: labels.period7d},
            {key: "30d", label: labels.period30d},
            {key: "90d", label: labels.period90d},
            {key: "1y", label: labels.period1y},
          ].map(({key, label}) => (
            <button key={key} onClick={() => setAnalyticsPeriod(key)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${analyticsPeriod === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ideas Over Time */}
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsIdeasOverTime}</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                <defs>
                  <linearGradient id="ideasOverTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed2124" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ed2124" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#ed2124" strokeWidth={2} fill="url(#ideasOverTime)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Active vs Completed */}
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsActiveVsCompleted}</h3>
          <div className="mt-4 flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={180} height={180}>
                <RePie>
                  <Pie data={activeVsCompletedData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {activeVsCompletedData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {activeVsCompletedData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{backgroundColor: d.fill}} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Participation Growth */}
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsParticipationGrowth}</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Votes & Support */}
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsVotesSupport}</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voteSupportData} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="title" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]} fill="#ed2124" name="Votes" />
                <Bar dataKey="supporters" radius={[4, 4, 0, 0]} fill="#10b981" name="Supporters" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.searchPlaceholder ?? "Search..."} className="w-full rounded-2xl border border-border/60 bg-card px-10 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={15} /></button>}
        </div>
        <FiltersBar filters={filters} onChange={handleFilterChange} labels={labels} onClear={clearFilters} categoryOptions={categoryOptions} />
        <p className="text-sm text-muted-foreground">{displayedIdeas.length} {labels.title?.toLowerCase()}</p>
      </div>

      {/* IDEAS TABLE */}
      <GlassCard className="overflow-hidden p-0" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort("title")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                    {labels.tableTitle} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">{labels.tableCategory}</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">{labels.tableCreator}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.tableStatus}</th>
                <th className="px-4 py-3 text-right">
                  <button onClick={() => handleSort("votes")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                    {labels.tableVotes} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground md:table-cell">
                  <button onClick={() => handleSort("supporters")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.tableSupporters} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  <button onClick={() => handleSort("participants")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.tableParticipants} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  <button onClick={() => handleSort("messages")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.tableMessages} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  {labels.tableCreated}
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayedIdeas.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center">
                  <Lightbulb className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">{labels.noResults}</p>
                </td></tr>
              ) : displayedIdeas.map((idea) => (
                <tr key={idea.id} onClick={() => setSelectedIdea(idea)} className="cursor-pointer border-b border-border/30 transition hover:bg-muted/20">
                  <td className="px-4 py-3">
                    {idea.image_url ? (
                      <img src={idea.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Lightbulb size={14} /></span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate font-semibold text-foreground">{idea.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{idea.description}</p>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {idea.category_name ? (
                      <span className="inline-flex items-center rounded-md bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">{idea.category_name}</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {idea.author ? (
                      <div className="flex items-center gap-2">
                        <AdminAvatar profile={idea.author} className="h-6 w-6" />
                        <span className="truncate text-xs text-muted-foreground">{displayName(idea.author)}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[idea.status] ?? "border-muted bg-muted/30 text-muted-foreground"}`}>
                      {STATUS_LABEL[idea.status] ?? idea.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{idea.votes_count}</td>
                  <td className="hidden px-4 py-3 text-right font-bold text-foreground md:table-cell">{idea.supporters_count}</td>
                  <td className="hidden px-4 py-3 text-right font-bold text-foreground lg:table-cell">{idea.participants_count}</td>
                  <td className="hidden px-4 py-3 text-right text-muted-foreground lg:table-cell">{idea.messages_count}</td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">{formatDate(idea.created_at, locale)}</td>
                  <td className="px-4 py-3"><ChevronRight size={15} className="text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* TOP IDEAS SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Most Supported */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.analyticsMostSupported}</h3>
            <Star size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {topSupported.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : topSupported.map((idea, i) => (
              <div key={idea.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{idea.title}</p>
                  <p className="text-xs text-muted-foreground">{idea.supporters_count} supporters</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{idea.supportPercentage}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Voted */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.analyticsMostViewed}</h3>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {topVoted.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : topVoted.map((idea, i) => (
              <div key={idea.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{idea.title}</p>
                  <p className="text-xs text-muted-foreground">{idea.votes_count} votes</p>
                </div>
                <span className="text-sm font-bold text-primary">{idea.votes_count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Most Discussed */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.analyticsMostDiscussed}</h3>
            <MessageCircle size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {mostDiscussed.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : mostDiscussed.map((idea, i) => (
              <div key={idea.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{idea.title}</p>
                  <p className="text-xs text-muted-foreground">{idea.comments_count} comments</p>
                </div>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{idea.comments_count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* CATEGORY ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsCategory}</h3>
          <div className="mt-4 flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <RePie>
                  <Pie data={initialKpi.categoryDistribution.map((d, i) => ({...d, fill: PIECHART_COLORS[i % PIECHART_COLORS.length]}))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count">
                    {initialKpi.categoryDistribution.map((_, i) => <Cell key={i} fill={PIECHART_COLORS[i % PIECHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {initialKpi.categoryDistribution.map((d, i) => (
                <div key={d.category} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{backgroundColor: PIECHART_COLORS[i % PIECHART_COLORS.length]}} />
                  <span className="text-muted-foreground">{d.category}</span>
                  <span className="ml-auto font-bold text-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsGrowthByCategory}</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={initialKpi.categoryDistribution.slice(0, 8)} margin={{top: 5, right: 5, bottom: 0, left: -20}} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="category" tick={{fontSize: 10}} tickLine={false} axisLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#ed2124" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* IDEA DETAIL PANEL */}
      {selectedIdea && (
        <div className={`fixed inset-0 z-50 flex ${isRtl ? "justify-start" : "justify-end"}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedIdea(null)} />
          <div ref={panelRef} className="relative flex w-full max-w-lg flex-col bg-background shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-5 py-4 backdrop-blur-md">
              <h2 className="text-base font-black text-foreground">{labels.detailTitle}</h2>
              <button onClick={() => setSelectedIdea(null)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              {/* Cover Image */}
              {selectedIdea.image_url && (
                <img src={selectedIdea.image_url} alt="" className="w-full h-40 rounded-xl object-cover" />
              )}

              {/* Idea Header */}
              <div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lightbulb size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-foreground">{selectedIdea.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedIdea.description || labels.detailNoDescription}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[selectedIdea.status] ?? ""}`}>
                    {STATUS_LABEL[selectedIdea.status] ?? selectedIdea.status}
                  </span>
                  {selectedIdea.category_name && (
                    <span className="inline-flex items-center rounded-md bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">{selectedIdea.category_name}</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {selectedIdea.author && (
                    <div className="flex items-center gap-1.5">
                      <AdminAvatar profile={selectedIdea.author} className="h-5 w-5" />
                      <span>{displayName(selectedIdea.author)}</span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatDate(selectedIdea.created_at, locale)}</span>
                </div>
              </div>

              {/* Statistics */}
              <GlassCard className="p-4">
                <p className="text-sm font-bold text-foreground mb-3">{labels.detailStatistics}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.votes_count}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.votes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.supporters_count}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.supporters}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.participants_count}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.participants}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.comments_count}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.detailComments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.messages_count}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.detailMessages}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-foreground">{selectedIdea.views}</p>
                    <p className="text-[11px] text-muted-foreground">{labels.detailViews}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{labels.supporters}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedIdea.supportPercentage}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{width: `${selectedIdea.supportPercentage}%`}} />
                </div>
              </GlassCard>

              {/* Lifecycle Timeline */}
              <GlassCard className="p-4">
                <p className="text-sm font-bold text-foreground mb-3">{labels.detailTimeline}</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Lightbulb size={12} /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Idea Created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedIdea.created_at, locale)}</p>
                    </div>
                  </div>
                  {selectedIdea.supporters_count > 0 && (
                    <div className="ml-3 border-l-2 border-border/40 pl-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"><Users size={12} /></span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Community Support</p>
                          <p className="text-xs text-muted-foreground">{selectedIdea.supporters_count} supporters</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedIdea.participants_count > 0 && (
                    <div className="ml-3 border-l-2 border-border/40 pl-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><UserPlus size={12} /></span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Participants Joined</p>
                          <p className="text-xs text-muted-foreground">{selectedIdea.participants_count} participants</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedIdea.status === "in_progress" && (
                    <div className="ml-3 border-l-2 border-border/40 pl-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"><Activity size={12} /></span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">In Progress</p>
                          <p className="text-xs text-muted-foreground">Project started</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedIdea.status === "completed" && (
                    <div className="ml-3 border-l-2 border-emerald-400/40 pl-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle size={12} /></span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Completed</p>
                          <p className="text-xs text-muted-foreground">{formatDate(selectedIdea.updated_at, locale)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Group Chat Info */}
              {selectedIdea.messages_count > 0 && (
                <GlassCard className="p-4">
                  <p className="text-sm font-bold text-foreground mb-3">{labels.detailChat}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{labels.detailChatMessages}</span>
                      <span className="font-semibold text-foreground">{selectedIdea.messages_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{labels.detailChatMembers}</span>
                      <span className="font-semibold text-foreground">{selectedIdea.participants_count}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20">{labels.detailChatOpen}</button>
                      <button className="flex-1 rounded-xl bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/50">{labels.detailChatAttachments}</button>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Moderation Actions */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/50">
                  <Edit3 size={13} /> {labels.moderationEdit}
                </button>
                <button className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/50">
                  <Archive size={13} /> {labels.archive}
                </button>
                <button className="flex items-center gap-1.5 rounded-xl border border-red-200/60 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 size={13} /> {labels.moderationDelete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
