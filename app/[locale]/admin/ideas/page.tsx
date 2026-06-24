import {getTranslations} from "next-intl/server";
import {getAdminIdeasKPISummary, getAdminIdeasWithStats, getAdminTopIdeas} from "@/lib/data/admin";
import {IdeasClient} from "./ideas-client";

export default async function AdminIdeasPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{search?: string; status?: string}>;
}) {
  const {locale} = await params;
  const sp = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});

  let kpiData: Awaited<ReturnType<typeof getAdminIdeasKPISummary>> | null = null;
  let ideas: Awaited<ReturnType<typeof getAdminIdeasWithStats>> = [];
  let topVoted: Awaited<ReturnType<typeof getAdminTopIdeas>> = [];
  let topSupported: Awaited<ReturnType<typeof getAdminTopIdeas>> = [];
  let mostDiscussed: Awaited<ReturnType<typeof getAdminTopIdeas>> = [];

  const settled = await Promise.allSettled([
    getAdminIdeasKPISummary(),
    getAdminIdeasWithStats(sp.search, {status: sp.status}),
    getAdminTopIdeas("most_votes", 5),
    getAdminTopIdeas("most_supporters", 5),
    getAdminTopIdeas("most_comments", 5),
  ]);
  if (settled[0].status === "fulfilled") kpiData = settled[0].value;
  else console.error("[AdminIdeasPage] getAdminIdeasKPISummary failed", settled[0].reason);
  if (settled[1].status === "fulfilled") ideas = settled[1].value;
  else console.error("[AdminIdeasPage] getAdminIdeasWithStats failed", settled[1].reason);
  if (settled[2].status === "fulfilled") topVoted = settled[2].value;
  if (settled[3].status === "fulfilled") topSupported = settled[3].value;
  if (settled[4].status === "fulfilled") mostDiscussed = settled[4].value;

  const safeKpi = kpiData ?? {
    totalIdeas: 0, newThisMonth: 0, activeIdeas: 0, completedIdeas: 0,
    totalParticipants: 0, avgSupportScore: 0,
    categoryDistribution: [], monthlyGrowth: [], dailyGrowth: [],
  };

  const labels = {
    eyebrow: t("ideasPage.eyebrow"),
    title: t("ideasPage.title"),
    description: t("ideasPage.description"),
    createFeatured: t("ideasPage.createFeatured"),
    active: t("ideasPage.active"),
    inProgress: t("ideasPage.inProgress"),
    featured: t("ideasPage.featured"),
    completed: t("ideasPage.completed"),
    archived: t("ideasPage.archived"),
    votes: t("ideasPage.votes"),
    supporters: t("ideasPage.supporters"),
    participants: t("ideasPage.participants"),
    groupChats: t("ideasPage.groupChats"),
    successRate: t("ideasPage.successRate"),
    feature: t("ideasPage.feature"),
    pin: t("ideasPage.pin"),
    archive: t("ideasPage.archive"),
    moderate: t("ideasPage.moderate"),
    allStatus: t("ideasPage.allStatus"),
    kpiTotalIdeas: t("ideasPage.kpiTotalIdeas"),
    kpiNewThisMonth: t("ideasPage.kpiNewThisMonth"),
    kpiActive: t("ideasPage.kpiActive"),
    kpiCompleted: t("ideasPage.kpiCompleted"),
    kpiParticipants: t("ideasPage.kpiParticipants"),
    kpiAvgSupport: t("ideasPage.kpiAvgSupport"),
    analyticsIdeasOverTime: t("ideasPage.analyticsIdeasOverTime"),
    analyticsActiveVsCompleted: t("ideasPage.analyticsActiveVsCompleted"),
    analyticsParticipationGrowth: t("ideasPage.analyticsParticipationGrowth"),
    analyticsVotesSupport: t("ideasPage.analyticsVotesSupport"),
    period7d: t("ideasPage.period7d"),
    period30d: t("ideasPage.period30d"),
    period90d: t("ideasPage.period90d"),
    period1y: t("ideasPage.period1y"),
    periodAll: t("ideasPage.periodAll"),
    tableTitle: t("ideasPage.tableTitle"),
    tableCategory: t("ideasPage.tableCategory"),
    tableCreator: t("ideasPage.tableCreator"),
    tableStatus: t("ideasPage.tableStatus"),
    tableVotes: t("ideasPage.tableVotes"),
    tableSupporters: t("ideasPage.tableSupporters"),
    tableParticipants: t("ideasPage.tableParticipants"),
    tableMessages: t("ideasPage.tableMessages"),
    tableCreated: t("ideasPage.tableCreated"),
    allCategories: t("ideasPage.allCategories"),
    searchPlaceholder: t("ideasPage.searchPlaceholder"),
    filterStatus: t("ideasPage.filterStatus"),
    filterCategory: t("ideasPage.filterCategory"),
    filterMostSupported: t("ideasPage.filterMostSupported"),
    filterMostDiscussed: t("ideasPage.filterMostDiscussed"),
    filterRecentlyCreated: t("ideasPage.filterRecentlyCreated"),
    filterCompleted: t("ideasPage.filterCompleted"),
    detailTitle: t("ideasPage.detailTitle"),
    detailDescription: t("ideasPage.detailDescription"),
    detailStatistics: t("ideasPage.detailStatistics"),
    detailParticipants: t("ideasPage.detailParticipants"),
    detailSupporters: t("ideasPage.detailSupporters"),
    detailMessages: t("ideasPage.detailMessages"),
    detailComments: t("ideasPage.detailComments"),
    detailViews: t("ideasPage.detailViews"),
    detailTimeline: t("ideasPage.detailTimeline"),
    detailChat: t("ideasPage.detailChat"),
    detailChatMembers: t("ideasPage.detailChatMembers"),
    detailChatMessages: t("ideasPage.detailChatMessages"),
    detailChatLastActive: t("ideasPage.detailChatLastActive"),
    detailChatOpen: t("ideasPage.detailChatOpen"),
    detailChatAttachments: t("ideasPage.detailChatAttachments"),
    detailParticipantAccept: t("ideasPage.detailParticipantAccept"),
    detailParticipantPending: t("ideasPage.detailParticipantPending"),
    detailParticipantDeclined: t("ideasPage.detailParticipantDeclined"),
    detailRemoveParticipant: t("ideasPage.detailRemoveParticipant"),
    detailViewConversation: t("ideasPage.detailViewConversation"),
    detailNoDescription: t("ideasPage.detailNoDescription"),
    analyticsCategory: t("ideasPage.analyticsCategory"),
    analyticsTopCategories: t("ideasPage.analyticsTopCategories"),
    analyticsGrowthByCategory: t("ideasPage.analyticsGrowthByCategory"),
    analyticsMostViewed: t("ideasPage.analyticsMostViewed"),
    analyticsMostSupported: t("ideasPage.analyticsMostSupported"),
    analyticsMostDiscussed: t("ideasPage.analyticsMostDiscussed"),
    analyticsFastestGrowing: t("ideasPage.analyticsFastestGrowing"),
    moderationEdit: t("ideasPage.moderationEdit"),
    moderationHide: t("ideasPage.moderationHide"),
    moderationDelete: t("ideasPage.moderationDelete"),
    moderationReviewReports: t("ideasPage.moderationReviewReports"),
    exportCSV: t("ideasPage.exportCSV"),
    exportExcel: t("ideasPage.exportExcel"),
    exportPDF: t("ideasPage.exportPDF"),
    noResults: t("ideasPage.noResults"),
    loading: t("ideasPage.loading"),
    realtime: t("ideasPage.realtime"),
    search: t("search"),
  };

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <IdeasClient
        initialKpi={safeKpi}
        initialIdeas={ideas}
        topVoted={topVoted}
        topSupported={topSupported}
        mostDiscussed={mostDiscussed}
        labels={labels}
        locale={locale}
        initialSearch={sp.search ?? ""}
      />
    </div>
  );
}
