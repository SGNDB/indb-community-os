import {getTranslations} from "next-intl/server";
import {
  getAdminDashboardKPIs,
  getAdminUserGrowth,
  getAdminCommunityActivity,
  getAdminDonationsByCampaign,
  getAdminVolunteerActivity,
  getAdminRecentActivity,
  getAdminDonationTrend,
  getAdminConversationTrend,
  getAdminPaymentMethods,
  getAdminHourlyActivity,
  getAdminRealtimeActivity,
  getAdminIdeaGrowth,
  getAdminGraatekGrowth,
  getAdminHealthIndicators,
  getCurrentAdminProfile,
} from "@/lib/data/admin";
import ChartsWrapper from "./charts-wrapper";

export default async function AdminDashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  const [
    kpis,
    userGrowth,
    ideaGrowth,
    graatekGrowth,
    communityActivity,
    donationsByCampaign,
    volunteerActivity,
    recentActivity,
    donationTrend,
    conversationTrend,
    paymentMethods,
    hourlyActivity,
    realtimeActivity,
    health,
    adminProfile,
  ] = await Promise.all([
    getAdminDashboardKPIs(),
    getAdminUserGrowth(),
    getAdminIdeaGrowth(),
    getAdminGraatekGrowth(),
    getAdminCommunityActivity(),
    getAdminDonationsByCampaign(),
    getAdminVolunteerActivity(),
    getAdminRecentActivity(),
    getAdminDonationTrend(),
    getAdminConversationTrend(),
    getAdminPaymentMethods(),
    getAdminHourlyActivity(),
    getAdminRealtimeActivity(),
    getAdminHealthIndicators(),
    getCurrentAdminProfile(),
  ]);

  const tLabels = {
    kpi: {
      totalUsers: t("kpi.totalUsers"),
      activeUsersToday: t("kpi.activeUsersToday"),
      activeIdeas: t("kpi.activeIdeas"),
      activeGraatek: t("kpi.activeGraatek"),
      activeCampaigns: t("kpi.activeCampaigns"),
      activeVolunteers: t("kpi.activeVolunteers"),
      donationsThisMonth: t("kpi.donationsThisMonth"),
      messagesToday: t("kpi.messagesToday"),
    },
    communityGrowth: t("charts.communityGrowth"),
    usersTab: t("charts.usersTab"),
    ideasTab: t("charts.ideasTab"),
    graatekTab: t("charts.graatekTab"),
    donationsTab: t("charts.donationsTab"),
    volunteersTab: t("charts.volunteersTab"),
    byCampaign: t("charts.byCampaign"),
    donationMethods: t("charts.donationMethods"),
    hourlyActivity: t("charts.hourlyActivity"),
    dailyMessages: t("charts.dailyMessages"),
    realtimeActivity: t("charts.realtimeActivity"),
    growthRate: t("charts.growthRate"),
    successRate: t("charts.successRate"),
    engagementRate: t("charts.engagementRate"),
    noData: t("noData"),
    eyebrow: t("eyebrow"),
    commandCenter: t("commandCenter"),
    heroDescription: t("hero.description"),
    healthEyebrow: t("health.eyebrow"),
    healthTitle: t("health.title"),
    members: t("health.members"),
    posts: t("health.posts"),
    ideas: t("health.ideas"),
    memories: t("health.memories"),
    activeToday: t("health.activeToday"),
    newToday: t("health.newToday"),
    totalComments: t("health.totalComments"),
    adminName: adminProfile?.full_name ?? adminProfile?.username ?? "Admin",
    donationsSnapshot: t("dashboard.donationsSnapshot"),
    volunteerSnapshot: t("dashboard.volunteerSnapshot"),
    liveFeed: t("dashboard.liveFeed"),
    quickActions: t("dashboard.quickActions"),
    monthlyTrend: t("dashboard.monthlyTrend"),
    monthlyActivity: t("dashboard.monthlyActivity"),
    sendNotification: t("dashboard.sendNotification"),
    reviewReports: t("dashboard.reviewReports"),
    siteSettings: t("dashboard.siteSettings"),
    addAdmin: t("dashboard.addAdmin"),
    featureContent: t("dashboard.featureContent"),
    verifyPayments: t("dashboard.verifyPayments"),
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <ChartsWrapper
        kpis={kpis}
        userGrowth={userGrowth}
        ideaGrowth={ideaGrowth}
        graatekGrowth={graatekGrowth}
        communityActivity={communityActivity}
        donationsByCampaign={donationsByCampaign}
        volunteerActivity={volunteerActivity}
        recentActivity={recentActivity}
        donationTrend={donationTrend}
        conversationTrend={conversationTrend}
        paymentMethods={paymentMethods}
        hourlyActivity={hourlyActivity}
        realtimeActivity={realtimeActivity}
        health={health}
        labels={tLabels}
        locale={locale}
      />
    </div>
  );
}