import {createClient} from "@/lib/supabase/server";
import {getTranslations} from "next-intl/server";
import {getAdminDashboardKPIs, getAdminRecentActivity} from "@/lib/data/admin";
import {getAdminOverview} from "@/lib/data/admin";
import {AdminDashboardClient} from "./admin-dashboard-client";

export default async function AdminDashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const supabase = await createClient();

  const [kpis, overview, activity] = await Promise.all([
    getAdminDashboardKPIs(),
    getAdminOverview(),
    getAdminRecentActivity(),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("commandCenter")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hero.description")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <a
            key={kpi.label}
            href={kpi.href}
            className="group rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_16px_rgba(7,31,54,0.06)] transition hover:shadow-[0_8px_24px_rgba(7,31,54,0.1)]"
          >
            <p className="text-sm font-medium text-muted-foreground">{t(`kpi.${kpi.label}`)}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{kpi.value.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
              <span>{t("crud.view")}</span>
              <span aria-hidden="true">→</span>
            </div>
          </a>
        ))}
      </div>

      {/* Overview + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Community Health */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_16px_rgba(7,31,54,0.06)] lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("health.eyebrow")}</h2>
          <p className="text-lg font-black text-foreground">{t("health.title")}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.members")}</p>
              <p className="text-xl font-bold text-foreground">{overview.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600">{t("health.today", {count: overview.newMembersToday})}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.posts")}</p>
              <p className="text-xl font-bold text-foreground">{overview.totalPosts.toLocaleString()}</p>
              <p className="text-xs text-primary">{t("health.today", {count: overview.postsToday})}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.ideas")}</p>
              <p className="text-xl font-bold text-foreground">{overview.totalIdeas.toLocaleString()}</p>
              <p className="text-xs text-amber-600">{t("health.today", {count: overview.ideasToday})}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.memories")}</p>
              <p className="text-xl font-bold text-foreground">{overview.totalMemories.toLocaleString()}</p>
              <p className="text-xs text-purple-600">{t("health.today", {count: overview.memoriesToday})}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.activeToday")}</p>
              <p className="text-xl font-bold text-foreground">{overview.activeToday}</p>
              <p className="text-xs text-green-600">{t("health.activeSignal")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t("health.totalComments", {count: ""}).replace(/\d+/g, "").trim()}</p>
              <p className="text-xl font-bold text-foreground">{overview.totalComments.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_16px_rgba(7,31,54,0.06)]">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("sections.overview")}</h2>
          <p className="text-lg font-black text-foreground">Recent Activity</p>
          <div className="mt-4 space-y-3">
            {activity.slice(0, 8).map((item) => (
              <a key={item.id} href={item.href} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-muted/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {item.type === "member" ? "👤" : item.type === "idea" ? "💡" : item.type === "graatek" ? "🎁" : item.type === "donation" ? "💰" : "📝"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Realtime Activity Feed */}
      <AdminDashboardClient />
    </div>
  );
}
