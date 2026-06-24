"use client";

import {useState, useMemo, useCallback, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {
  Users, UserCheck, UserPlus, Activity, Globe, TrendingUp,
  Search, X, SlidersHorizontal, ArrowUpDown,
  ExternalLink, ShieldCheck, ShieldX, Ban, CheckCircle,
  Clock, Mail, Phone, MapPin, Calendar, MessageCircle,
  Lightbulb, BookOpen, Gift, Landmark, UsersRound, Award,
  Zap, Sparkles, ChevronRight, MoreHorizontal, Filter,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";

import {AdminAvatar, GlassCard, displayName} from "@/components/admin/admin-shared";
import {AdminExportDropdown, type ExportColumn} from "@/components/admin/admin-export-dropdown";
import type {AdminUserGrowthPoint, AdminUserTimelineItem, AdminUserWithStats, AdminUsersKPISummary, AdminTopContributor} from "@/lib/data/admin";

const PIECHART_COLORS = ["#ed2124", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function formatNum(n: number, locale: string) {
  return n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");
}

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function timeAgo(date: string | null | undefined) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function statusColor(status: string) {
  switch (status) {
    case "active": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "inactive": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatus(user: AdminUserWithStats, activeDays = 7): "active" | "inactive" {
  if (!user.last_login) return "inactive";
  return Date.now() - new Date(user.last_login).getTime() < activeDays * 86400000 ? "active" : "inactive";
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

function computeTrendFromGrowth(data: AdminUserGrowthPoint[]): {value: string; positive: boolean} {
  if (data.length < 2) return {value: "0%", positive: true};
  const mid = Math.floor(data.length / 2);
  const first = data.slice(0, mid).reduce((s, p) => s + p.value, 0);
  const second = data.slice(mid).reduce((s, p) => s + p.value, 0);
  if (first === 0 && second === 0) return {value: "0%", positive: true};
  if (first === 0) return {value: "+100%", positive: true};
  const change = ((second - first) / first) * 100;
  return {value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`, positive: change >= 0};
}

function BadgeChip({label, icon}: {label: string; icon: React.ReactNode}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
      {icon}
      {label}
    </span>
  );
}

/* ─── KPI Card ─── */
function UsersKpiCard({label, value, trend, icon: Icon, chart}: {label: string; value: string; trend?: {value: string; positive: boolean}; icon: React.ElementType; chart?: React.ReactNode}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.03)] hover:border-border/80">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trend.positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
            {trend.positive ? <TrendingUp size={12} /> : null}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {chart && <div className="mt-2">{chart}</div>}
    </div>
  );
}

/* ─── IMPACT SCORE RING ─── */
function ImpactRing({score}: {score: number}) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ed2124";
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
      <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 45 45)" style={{transition: "stroke-dashoffset 1s ease"}} />
      <text x="45" y="42" textAnchor="middle" className="fill-foreground text-lg font-black">{score}</text>
      <text x="45" y="56" textAnchor="middle" className="fill-muted-foreground text-[9px] font-semibold">/100</text>
    </svg>
  );
}

/* ─── FILTERS BAR ─── */
function FiltersBar({filters, onChange, labels, onClear}: {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  labels: Record<string, string>;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
        <Filter size={15} />
        {labels.filterLabel ?? "Filters"}
        {(Object.keys(filters).length > 0) && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{Object.keys(filters).length}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-border/60 bg-card p-4 shadow-xl">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{labels.filterStatus ?? "Status"}</label>
              <select value={filters.status ?? ""} onChange={(e) => onChange("status", e.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm">
                <option value="">{labels.filterAllStatuses ?? "All Statuses"}</option>
                <option value="active">{labels.active ?? "Active"}</option>
                <option value="inactive">{labels.inactive ?? "Inactive"}</option>
                <option value="suspended">{labels.suspended ?? "Suspended"}</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {key: "verified", label: labels.filterVerified},
                {key: "donor", label: labels.filterDonor},
                {key: "volunteer", label: labels.filterVolunteer},
                {key: "ideaCreator", label: labels.filterIdeaCreator},
                {key: "graatekContributor", label: labels.filterGraatekContributor},
              ].map(({key, label}) => (
                <button key={key} onClick={() => onChange(key, filters[key] === "true" ? "" : "true")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filters[key] === "true" ? "bg-primary text-primary-foreground" : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={onClear} className="w-full rounded-xl border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/50">
              {labels.filterClear ?? "Clear Filters"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TIMELINE ITEM ─── */
function TimelineIcon({type}: {type: string}) {
  const icons: Record<string, React.ReactNode> = {
    post: <MessageCircle size={14} />,
    idea: <Lightbulb size={14} />,
    memory: <BookOpen size={14} />,
    graatek: <Gift size={14} />,
    donation: <Landmark size={14} />,
    credit: <Award size={14} />,
    member: <UserPlus size={14} />,
  };
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
      {icons[type] ?? <Zap size={14} />}
    </span>
  );
}

function typeLabel(type: string, labels: Record<string, string>) {
  const map: Record<string, string> = {
    post: labels.timelinePost, idea: labels.timelineIdea, memory: labels.timelineMemory,
    graatek: labels.timelineGraatek, donation: labels.timelineDonation, credit: labels.timelineCredit,
  };
  return map[type] ?? type;
}

/* ─── MAIN COMPONENT ─── */
export function AdminUsersClient({
  initialKpi, initialUsers, topDonors, topVolunteers, topActive, labels, locale, initialSearch,
}: {
  initialKpi: AdminUsersKPISummary;
  initialUsers: AdminUserWithStats[];
  topDonors: AdminTopContributor[];
  topVolunteers: AdminTopContributor[];
  topActive: AdminTopContributor[];
  labels: Record<string, string>;
  locale: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<AdminUserWithStats | null>(null);
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [growthPeriod, setGrowthPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [timeline, setTimeline] = useState<AdminUserTimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayedUsers = useMemo(() => {
    let result = [...initialUsers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
    }
    if (filters.status) {
      result = result.filter(u => getStatus(u) === filters.status);
    }
    if (filters.verified === "true") {
      result = result.filter(u => u.is_verified);
    }
    if (filters.donor === "true") {
      result = result.filter(u => (u.donations_count ?? 0) > 0);
    }
    if (filters.volunteer === "true") {
      result = result.filter(u => (u.volunteer_activities ?? 0) > 0);
    }
    if (filters.ideaCreator === "true") {
      result = result.filter(u => (u.ideas_count ?? 0) > 0);
    }
    if (filters.graatekContributor === "true") {
      result = result.filter(u => (u.graatek_count ?? 0) > 0);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "name") cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "");
      else if (sortColumn === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortColumn === "last_login") cmp = (a.last_login ? new Date(a.last_login).getTime() : 0) - (b.last_login ? new Date(b.last_login).getTime() : 0);
      else if (sortColumn === "contribution_score") cmp = (a.contribution_score ?? 0) - (b.contribution_score ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [initialUsers, search, sortColumn, sortDir, filters]);

  const userExportColumns = useMemo<ExportColumn<AdminUserWithStats>[]>(() => [
    {header: labels.name ?? "Name", getValue: (user) => displayName(user)},
    {header: "Username", getValue: (user) => user.username ? `@${user.username}` : ""},
    {header: labels.status ?? "Status", getValue: (user) => labels[getStatus(user)] ?? getStatus(user)},
    {header: labels.joinDate ?? "Join date", getValue: (user) => formatDate(user.created_at, locale)},
    {header: labels.lastActive ?? "Last active", getValue: (user) => timeAgo(user.last_login)},
    {header: labels.contributionScore ?? "Contribution score", getValue: (user) => user.contribution_score ?? 0},
    {header: labels.panelPosts ?? "Posts", getValue: (user) => user.posts_count ?? 0},
    {header: labels.panelIdeas ?? "Ideas", getValue: (user) => user.ideas_count ?? 0},
    {header: labels.panelMemories ?? "Memories", getValue: (user) => user.memories_count ?? 0},
    {header: labels.panelGraatek ?? "Graatek", getValue: (user) => user.graatek_count ?? 0},
    {header: labels.panelDonations ?? "Donations", getValue: (user) => user.donations_total ?? 0},
    {header: labels.panelVolunteerActivities ?? "Volunteer activities", getValue: (user) => user.volunteer_activities ?? 0},
  ], [labels, locale]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDir("desc"); }
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("userSearch", search);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`?${params.toString()}`);
  }, [search, filters, router]);

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
    router.push("?");
  }, [router]);

  const openProfile = useCallback(async (user: AdminUserWithStats) => {
    setSelectedUser(user);
    setLoadingTimeline(true);
    setTimeline([]);
    try {
      const {fetchUserTimeline} = await import("./actions");
      const items = await fetchUserTimeline(user.id);
      setTimeline(items);
    } catch { /* ignore */ }
    setLoadingTimeline(false);
  }, []);

  const closeProfile = useCallback(() => {
    setSelectedUser(null);
    setTimeline([]);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeProfile(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeProfile]);

  const growthData = useMemo(() => {
    const months = initialKpi.monthlyGrowth;
    const days = initialKpi.dailyGrowth;
    if (growthPeriod === "7d") return days.slice(-7).map(d => ({value: d.value, label: d.month}));
    if (growthPeriod === "30d") return days.slice(-30).map(d => ({value: d.value, label: d.month}));
    if (growthPeriod === "90d") return days.slice(-90).map(d => ({value: d.value, label: d.month}));
    return months.map(d => ({value: d.value, label: d.month}));
  }, [growthPeriod, initialKpi]);

  const trend6 = computeTrendFromGrowth(initialKpi.monthlyGrowth);
  const localeNum = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US");

  const langChartData = useMemo(() => initialKpi.languageDistribution.map((d, i) => ({...d, fill: PIECHART_COLORS[i % PIECHART_COLORS.length]})), [initialKpi]);

  const isRtl = locale === "ar";
  const badgeMap: Record<string, {label: string; icon: string}> = {
    community_leader: {label: labels.badgeCommunityLeader, icon: "🌟"},
    innovator: {label: labels.badgeInnovator, icon: "💡"},
    historian: {label: labels.badgeHistorian, icon: "🧠"},
    contributor: {label: labels.badgeContributor, icon: "🎁"},
    supporter: {label: labels.badgeSupporter, icon: "🤝"},
    volunteer: {label: labels.badgeVolunteer, icon: "🙋"},
  };

  return (
    <>
      {/* HEADER */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users size={22} /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{labels.eyebrow}</p>
              <h1 className="text-2xl font-black text-foreground">{labels.title}</h1>
              <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{labels.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/50">
              <UserPlus size={15} /> {labels.addUser}
            </button>
            <AdminExportDropdown
              labels={labels}
              rows={displayedUsers}
              columns={userExportColumns}
              filename="admin-users"
              title={labels.title ?? "Users"}
            />
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <UsersKpiCard label={labels.kpiTotalUsers} value={localeNum(initialKpi.totalUsers)} trend={trend6} icon={Users}
          chart={<MiniSparkline data={initialKpi.monthlyGrowth.map(m => ({value: m.value}))} />} />
        <UsersKpiCard label={labels.kpiActiveToday} value={localeNum(initialKpi.activeToday)} icon={Activity}
          chart={<MiniSparkline data={initialKpi.dailyGrowth.slice(-7).map(d => ({value: d.value}))} color="#10b981" />} />
        <UsersKpiCard label={labels.kpiNewThisMonth} value={localeNum(initialKpi.newThisMonth)} icon={UserPlus}
          chart={<MiniSparkline data={initialKpi.dailyGrowth.slice(-30).map(d => ({value: d.value}))} color="#3b82f6" />} />
        <UsersKpiCard label={labels.kpiVerifiedUsers} value={localeNum(initialKpi.verifiedUsers)} icon={ShieldCheck}
          chart={<MiniSparkline data={initialKpi.monthlyGrowth.map(() => ({value: Math.floor(Math.random() * 10) + 5}))} color="#8b5cf6" />} />
        <UsersKpiCard label={labels.kpiByLanguage} value={initialKpi.languageDistribution.length.toString()} icon={Globe}
          chart={<MiniSparkline data={initialKpi.languageDistribution.map(d => ({value: d.count}))} color="#f59e0b" />} />
        <UsersKpiCard label={labels.kpiMonthlyGrowth} value={`${trend6.positive ? "+" : ""}${trend6.value}`} trend={trend6} icon={TrendingUp} />
      </div>

      {/* SEARCH + FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.search ?? "Search users..."} className="w-full rounded-2xl border border-border/60 bg-card px-10 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={15} /></button>}
        </form>
        <FiltersBar filters={filters} onChange={handleFilterChange} labels={labels} onClear={clearFilters} />
        <p className="text-sm text-muted-foreground">{displayedUsers.length} {labels.title?.toLowerCase()}</p>
      </div>

      {/* USERS TABLE */}
      <GlassCard className="overflow-hidden p-0" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort("name")} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                    {labels.name} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  <button onClick={() => handleSort("created_at")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.joinDate} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  <button onClick={() => handleSort("last_login")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.lastActive} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.status}</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <button onClick={() => handleSort("contribution_score")} className="inline-flex items-center gap-1 transition hover:text-foreground">
                    {labels.contributionScore} <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">{labels.noResults}</p>
                </td></tr>
              ) : displayedUsers.map((user) => {
                const status = getStatus(user);
                return (
                  <tr key={user.id} onClick={() => openProfile(user)} className="cursor-pointer border-b border-border/30 transition hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AdminAvatar profile={user} className="h-8 w-8" />
                        {user.is_verified && <ShieldCheck size={12} className="shrink-0 text-blue-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{displayName(user)}</p>
                      <p className="text-xs text-muted-foreground">{user.username ? `@${user.username}` : ""}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell text-xs">{formatDate(user.created_at, locale)}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell text-xs">{timeAgo(user.last_login)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}>
                        {status === "active" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        {labels[status] ?? status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-foreground">{user.contribution_score ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={15} className="text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ANALYTICS SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language Distribution */}
        <GlassCard className="p-5">
          <h3 className="text-base font-black text-foreground">{labels.analyticsLanguage}</h3>
          <div className="mt-4 flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={langChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="count">
                    {langChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {langChartData.map((d, i) => (
                <div key={d.language} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{backgroundColor: PIECHART_COLORS[i % PIECHART_COLORS.length]}} />
                  <span className="text-muted-foreground">{d.language}</span>
                  <span className="ml-auto font-bold text-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* User Growth */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.analyticsUserGrowth}</h3>
            <div className="flex gap-1 rounded-xl bg-muted/30 p-0.5">
              {[
                {key: "7d", label: labels.analytics7d},
                {key: "30d", label: labels.analytics30d},
                {key: "90d", label: labels.analytics90d},
                {key: "1y", label: labels.analytics1y},
              ].map(({key, label}) => (
                <button key={key} onClick={() => setGrowthPeriod(key as "7d" | "30d" | "90d" | "1y")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${growthPeriod === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >{label}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#ed2124" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* INSIGHTS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Donors */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.insightsTopDonors}</h3>
            <Landmark size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {topDonors.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : topDonors.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <AdminAvatar profile={d} className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName(d)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatNum(d.metric, locale)} MRU</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Volunteers */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.insightsTopVolunteers}</h3>
            <UsersRound size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {topVolunteers.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : topVolunteers.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <AdminAvatar profile={d} className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName(d)}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{d.metric} {labels.insightsActivities}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Most Active */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">{labels.insightsMostActive}</h3>
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {topActive.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : topActive.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <AdminAvatar profile={d} className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName(d)}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{d.contribution_score} pts</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* USER PROFILE PANEL (overlay) */}
      {selectedUser && (
        <div className={`fixed inset-0 z-50 flex ${isRtl ? "justify-start" : "justify-end"}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeProfile} />
          <div ref={panelRef} className={`relative flex w-full max-w-lg flex-col bg-background shadow-2xl overflow-y-auto ${isRtl ? "animate-slide-in-left" : "animate-slide-in-right"}`}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-5 py-4 backdrop-blur-md">
              <h2 className="text-base font-black text-foreground">{labels.panelTitle}</h2>
              <button onClick={closeProfile} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <AdminAvatar profile={selectedUser} className="h-16 w-16" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground">{displayName(selectedUser)}</h3>
                    {selectedUser.is_verified && <ShieldCheck size={16} className="text-blue-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedUser.username ? `@${selectedUser.username}` : ""}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar size={12} /> {labels.panelJoined} {formatDate(selectedUser.created_at, locale)}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {labels.panelLastLogin}: {timeAgo(selectedUser.last_login)}</span>
                  </div>
                </div>
              </div>

              {/* Impact Score */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  <ImpactRing score={selectedUser.impact_score} />
                  <div>
                    <p className="text-sm font-bold text-foreground">{labels.impactTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedUser.badges.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : selectedUser.badges.map((b) => {
                        const badge = badgeMap[b];
                        return badge ? <BadgeChip key={b} label={badge.label} icon={<span className="text-xs">{badge.icon}</span>} /> : null;
                      })}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Community Stats */}
              <GlassCard className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.panelCommunityStats}</p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    {label: labels.panelPosts, value: selectedUser.posts_count, icon: <MessageCircle size={14} />},
                    {label: labels.panelIdeas, value: selectedUser.ideas_count, icon: <Lightbulb size={14} />},
                    {label: labels.panelMemories, value: selectedUser.memories_count, icon: <BookOpen size={14} />},
                    {label: labels.panelGraatek, value: selectedUser.graatek_count, icon: <Gift size={14} />},
                    {label: labels.panelDonations, value: `${formatNum(selectedUser.donations_total, locale)} MRU`, icon: <Landmark size={14} />},
                    {label: labels.panelDonations, value: `${selectedUser.donations_count}`, icon: <Landmark size={14} />},
                    {label: labels.panelVolunteerActivities, value: `${selectedUser.volunteer_activities}`, icon: <UsersRound size={14} />},
                    {label: "Score", value: `${selectedUser.contribution_score}`, icon: <Award size={14} />},
                  ].slice(0, 8).map((s, i) => (
                    <div key={i} className="rounded-xl bg-muted/30 p-3 text-center">
                      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{s.icon}</div>
                      <p className="text-sm font-black text-foreground">{s.value}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Activity Timeline */}
              <GlassCard className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.timelineTitle}</p>
                <div className="mt-3 space-y-0">
                  {loadingTimeline ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : timeline.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">{labels.timelineNoActivity}</p>
                  ) : (
                    timeline.map((item, i) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <TimelineIcon type={item.type} />
                          {i < timeline.length - 1 && <div className="mt-1 w-px flex-1 bg-border/60" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-semibold text-foreground">{typeLabel(item.type, labels)}</p>
                          <p className="text-xs text-muted-foreground">{item.title}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground/60">{timeAgo(item.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Admin Actions */}
              <GlassCard className="p-4" hover={false}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Admin Actions</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <CheckCircle size={13} /> {labels.panelVerifyUser}
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400">
                    <ShieldX size={13} /> {labels.panelRemoveVerification}
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                    <Ban size={13} /> {labels.panelSuspendUser}
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    <UserPlus size={13} /> {labels.panelReactivateUser}
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in keyframes */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
