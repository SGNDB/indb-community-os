import {getTranslations} from "next-intl/server";
import {
  getAdminModerationKPISummary,
  getAdminReportsWithDetails,
  getAdminModerationAuditLog,
  getAdminSafetySignals,
} from "@/lib/data/admin";
import {AdminModerationClient} from "./admin-moderation-client";

export default async function AdminModerationPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  let kpi = null;
  let reports: Awaited<ReturnType<typeof getAdminReportsWithDetails>> = [];
  let auditLog: Awaited<ReturnType<typeof getAdminModerationAuditLog>> = [];
  let signals: Awaited<ReturnType<typeof getAdminSafetySignals>> = [];

  const settled = await Promise.allSettled([
    getAdminModerationKPISummary(),
    getAdminReportsWithDetails(),
    getAdminModerationAuditLog(),
    getAdminSafetySignals(),
  ]);
  if (settled[0].status === "fulfilled") kpi = settled[0].value;
  else console.error("[AdminModerationPage] getAdminModerationKPISummary failed", settled[0].reason);
  if (settled[1].status === "fulfilled") reports = settled[1].value;
  else console.error("[AdminModerationPage] getAdminReportsWithDetails failed", settled[1].reason);
  if (settled[2].status === "fulfilled") auditLog = settled[2].value;
  else console.error("[AdminModerationPage] getAdminModerationAuditLog failed", settled[2].reason);
  if (settled[3].status === "fulfilled") signals = settled[3].value;
  else console.error("[AdminModerationPage] getAdminSafetySignals failed", settled[3].reason);

  const safeKpi = kpi ?? {
    openReports: 0, highPriority: 0, usersUnderReview: 0,
    removedContent: 0, resolvedReports: 0, reportRate: 0,
    monthlyGrowth: [], dailyGrowth: [],
    categoryDistribution: [], typeDistribution: [],
  };

  const labels = {
    moderationPage: t("moderationPage"),
    kpiOpenReports: t("moderationPage.openReports"),
    kpiHighPriority: t("moderationPage.highPriority"),
    kpiUsersUnderReview: t("moderationPage.usersUnderReview"),
    kpiRemovedContent: t("moderationPage.removedContent"),
    kpiResolvedReports: t("moderationPage.resolvedReports"),
    kpiReportRate: t("moderationPage.reportRate"),
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <AdminModerationClient
        initialKpi={safeKpi}
        initialReports={reports}
        initialAuditLog={auditLog}
        initialSignals={signals}
        labels={labels}
        locale={locale}
      />
    </div>
  );
}
