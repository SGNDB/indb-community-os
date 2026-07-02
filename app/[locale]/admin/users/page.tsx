import {getTranslations} from "next-intl/server";
import {AdminPageLayout} from "@/components/admin/ui/admin-page-layout";
import {getAdminUsersWithStats, getAdminUsersKPISummary, getAdminTopContributors} from "@/lib/data/admin";
import {AdminUsersClient} from "./users-client";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{userSearch?: string; language?: string; status?: string; verified?: string; donor?: string; volunteer?: string; ideaCreator?: string; graatekContributor?: string}>;
}) {
  const {locale} = await params;
  const sp = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});

  let kpiData: Awaited<ReturnType<typeof getAdminUsersKPISummary>> | null = null;
  let users: Awaited<ReturnType<typeof getAdminUsersWithStats>> = [];
  let topDonors: Awaited<ReturnType<typeof getAdminTopContributors>> = [];
  let topVolunteers: Awaited<ReturnType<typeof getAdminTopContributors>> = [];
  let topActive: Awaited<ReturnType<typeof getAdminTopContributors>> = [];

  try {
    [kpiData, users, topDonors, topVolunteers, topActive] = await Promise.all([
      getAdminUsersKPISummary(),
      getAdminUsersWithStats(sp.userSearch, {
        language: sp.language,
        status: sp.status,
        verified: sp.verified,
        donor: sp.donor,
        volunteer: sp.volunteer,
        ideaCreator: sp.ideaCreator,
        graatekContributor: sp.graatekContributor,
      }),
      getAdminTopContributors("donations", 5),
      getAdminTopContributors("volunteers", 5),
      getAdminTopContributors("most_active", 5),
    ]);
  } catch (err) {
    console.error("[AdminUsersPage] data fetch failed", err);
  }

  const safeKpi = kpiData ?? {
    totalUsers: 0, activeToday: 0, newThisMonth: 0, verifiedUsers: 0,
    languageDistribution: [],
    monthlyGrowth: [],
    dailyGrowth: [],
  };

  const labels = {
    eyebrow: t("usersPage.eyebrow"),
    title: t("usersPage.title"),
    description: t("usersPage.description"),
    addUser: t("usersPage.addUser"),
    export: t("usersPage.export"),
    search: t("usersPage.search"),
    noResults: t("usersPage.noResults"),
    name: t("usersPage.name"),
    phone: t("usersPage.phone"),
    joinDate: t("usersPage.joinDate"),
    language: t("usersPage.language"),
    lastActive: t("usersPage.lastActive"),
    status: t("usersPage.status"),
    contributionScore: t("usersPage.contributionScore"),
    active: t("usersPage.active"),
    inactive: t("usersPage.inactive"),
    suspended: t("usersPage.suspended"),
    viewProfile: t("usersPage.viewProfile"),
    kpiTotalUsers: t("usersPage.kpi.totalUsers"),
    kpiActiveToday: t("usersPage.kpi.activeToday"),
    kpiNewThisMonth: t("usersPage.kpi.newThisMonth"),
    kpiVerifiedUsers: t("usersPage.kpi.verifiedUsers"),
    kpiByLanguage: t("usersPage.kpi.byLanguage"),
    kpiMonthlyGrowth: t("usersPage.kpi.monthlyGrowth"),
    filterLabel: t("usersPage.filters.label"),
    filterLanguage: t("usersPage.filters.language"),
    filterStatus: t("usersPage.filters.status"),
    filterVerified: t("usersPage.filters.verified"),
    filterDonor: t("usersPage.filters.donor"),
    filterVolunteer: t("usersPage.filters.volunteer"),
    filterIdeaCreator: t("usersPage.filters.ideaCreator"),
    filterGraatekContributor: t("usersPage.filters.graatekContributor"),
    filterClear: t("usersPage.filters.clear"),
    filterAllLanguages: t("usersPage.filters.allLanguages"),
    filterAllStatuses: t("usersPage.filters.allStatuses"),
    panelTitle: t("usersPage.profilePanel.title"),
    panelCommunityStats: t("usersPage.profilePanel.communityStats"),
    panelPosts: t("usersPage.profilePanel.posts"),
    panelIdeas: t("usersPage.profilePanel.ideas"),
    panelMemories: t("usersPage.profilePanel.memories"),
    panelGraatek: t("usersPage.profilePanel.graatek"),
    panelMessages: t("usersPage.profilePanel.messages"),
    panelDonations: t("usersPage.profilePanel.donations"),
    panelVolunteerActivities: t("usersPage.profilePanel.volunteerActivities"),
    panelClose: t("usersPage.profilePanel.close"),
    panelJoined: t("usersPage.profilePanel.joined"),
    panelLastLogin: t("usersPage.profilePanel.lastLogin"),
    panelVerifyUser: t("usersPage.profilePanel.verifyUser"),
    panelRemoveVerification: t("usersPage.profilePanel.removeVerification"),
    panelSuspendUser: t("usersPage.profilePanel.suspendUser"),
    panelReactivateUser: t("usersPage.profilePanel.reactivateUser"),
    impactTitle: t("usersPage.impactScore.title"),
    impactScore: t("usersPage.impactScore.score"),
    impactBadges: t("usersPage.impactScore.badges"),
    badgeCommunityLeader: t("usersPage.impactScore.communityLeader"),
    badgeInnovator: t("usersPage.impactScore.innovator"),
    badgeHistorian: t("usersPage.impactScore.historian"),
    badgeContributor: t("usersPage.impactScore.contributor"),
    badgeSupporter: t("usersPage.impactScore.supporter"),
    badgeVolunteer: t("usersPage.impactScore.volunteer"),
    timelineTitle: t("usersPage.timeline.title"),
    timelineNoActivity: t("usersPage.timeline.noActivity"),
    timelinePost: t("usersPage.timeline.post"),
    timelineIdea: t("usersPage.timeline.idea"),
    timelineMemory: t("usersPage.timeline.memory"),
    timelineGraatek: t("usersPage.timeline.graatek"),
    timelineDonation: t("usersPage.timeline.donation"),
    timelineCredit: t("usersPage.timeline.credit"),
    analyticsLanguage: t("usersPage.analytics.languageAnalytics"),
    analyticsUserGrowth: t("usersPage.analytics.userGrowth"),
    analyticsDaily: t("usersPage.analytics.dailyRegistrations"),
    analyticsMonthly: t("usersPage.analytics.monthlyRegistrations"),
    analytics7d: t("usersPage.analytics.days7"),
    analytics30d: t("usersPage.analytics.days30"),
    analytics90d: t("usersPage.analytics.days90"),
    analytics1y: t("usersPage.analytics.year1"),
    insightsDonor: t("usersPage.insights.donorInsights"),
    insightsTotalDonations: t("usersPage.insights.totalDonations"),
    insightsDonationCount: t("usersPage.insights.donationCount"),
    insightsSupportedCampaigns: t("usersPage.insights.supportedCampaigns"),
    insightsTopDonors: t("usersPage.insights.topDonors"),
    insightsVolunteer: t("usersPage.insights.volunteerInsights"),
    insightsHours: t("usersPage.insights.volunteerHours"),
    insightsActivities: t("usersPage.insights.completedActivities"),
    insightsTopVolunteers: t("usersPage.insights.topVolunteers"),
    insightsTopContributors: t("usersPage.insights.topContributors"),
    insightsMostActive: t("usersPage.insights.mostActive"),
    insightsViewAll: t("usersPage.insights.viewAll"),
    exportCSV: t("usersPage.export.csv"),
    exportExcel: t("usersPage.export.excel"),
    exportPDF: t("usersPage.export.pdf"),
  };

  return (
    <AdminPageLayout
      title={t("usersPage.title")}
      subtitle={t("usersPage.description")}
      breadcrumbs={[
        {label: t("nav.dashboard"), href: `/${locale}/admin`},
        {label: t("nav.users"), href: `/${locale}/admin/users`},
      ]}
    >
      <AdminUsersClient
        initialKpi={safeKpi}
        initialUsers={users}
        topDonors={topDonors}
        topVolunteers={topVolunteers}
        topActive={topActive}
        labels={labels}
        locale={locale}
        initialSearch={sp.userSearch ?? ""}
      />
    </AdminPageLayout>
  );
}
