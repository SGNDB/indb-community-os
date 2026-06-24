import {getTranslations} from "next-intl/server";
import {getAdminDashboardKPIs, getAdminRecentActivity} from "@/lib/data/admin";
import {getAdminOverview} from "@/lib/data/admin";
import {AdminDashboardClient} from "./admin-dashboard-client";
import {HealthSection} from "./health-section";
import {ActivityTimeline} from "./activity-timeline";
import DashboardKpiWrapper from "./dashboard-kpi-wrapper";

export default async function AdminDashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  const [kpis, overview, activity] = await Promise.all([
    getAdminDashboardKPIs(),
    getAdminOverview(),
    getAdminRecentActivity(),
  ]);

  const kpiLabels: Record<string, string> = {
    totalUsers: t("kpi.totalUsers"),
    activeIdeas: t("kpi.activeIdeas"),
    activeGraatek: t("kpi.activeGraatek"),
    totalMemories: t("kpi.totalMemories"),
    messagesToday: t("kpi.messagesToday"),
    activeCampaigns: t("kpi.activeCampaigns"),
    totalVolunteers: t("kpi.totalVolunteers"),
    notificationsSent: t("kpi.notificationsSent"),
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("eyebrow")}</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t("commandCenter")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("hero.description")}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t("health.activeSignal")}
          </span>
        </div>
      </div>

      {/* KPI Grid with Sparklines */}
      <DashboardKpiWrapper kpis={kpis} labels={kpiLabels} locale={locale} />

      {/* Community Health + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <HealthSection overview={overview} t={t} />
        <ActivityTimeline activity={activity} t={t} />
      </div>

      {/* Realtime Activity Feed */}
      <AdminDashboardClient />
    </div>
  );
}
