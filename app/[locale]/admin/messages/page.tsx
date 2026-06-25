import {getTranslations} from "next-intl/server";
import {MessagesDashboard} from "@/components/admin/messages/messages-dashboard";

const messageLabelKeys = [
  "description",
  "tabsOverview",
  "tabsDirectory",
  "tabsModeration",
  "tabsSystemHealth",
  "searchPlaceholder",
  "export",
  "exportCSV",
  "exportExcel",
  "exportPDF",
  "exportTitle",
  "totalConversations",
  "messagesToday",
  "activeConversations",
  "groupChats",
  "reportedConversations",
  "dailyGrowth",
  "analytics",
  "messageVolume",
  "today",
  "days7",
  "days30",
  "days90",
  "year1",
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
  "daySun",
  "messages",
  "live",
  "realtimeMonitor",
  "messagesPerMinute",
  "activeWebSocketConnections",
  "deliveryFailuresLastHour",
  "groups",
  "groupChatAnalytics",
  "ideaGroups",
  "graatek",
  "avgParticipants",
  "avgMessages",
  "avgResponse",
  "idAndType",
  "participants",
  "status",
  "activity",
  "actions",
  "reported",
  "viewDetails",
  "conversationMetadata",
  "privacyStatus",
  "endToEndEncrypted",
  "privacyNoticeTitle",
  "privacyNoticeDescription",
  "close",
  "typeIdea",
  "typeGraatek",
  "typeGroup",
  "statusActive",
  "statusCompleted",
  "statusPending",
  "statusHealthy",
  "statusOperational",
  "statusDegraded",
  "statusNormal",
  "statusProcessing",
  "moderationQueue",
  "moderationDescription",
  "highPriority",
  "conversation",
  "reportedBy",
  "reviewContext",
  "queueEmpty",
  "allReportedReviewed",
  "reasonHarassment",
  "reasonSpam",
  "minutesAgo",
  "hourAgo",
  "hoursAgo",
  "systemStatus",
  "systemHealth",
  "performance",
  "metrics",
  "realtimeStatus",
  "databaseSync",
  "pushNotifications",
  "averageLatency",
  "deliverySuccessRate",
  "storageUsageImages",
  "storageUsed",
  "queues",
  "messageQueues",
  "databaseWriteQueue",
  "notificationQueue",
] as const;

export default async function AdminMessagesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const labels = Object.fromEntries(messageLabelKeys.map((key) => [key, t(`messagesPage.${key}`)]));

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          💬 {t("nav.messages")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{labels.description}</p>
      </div>

      <MessagesDashboard labels={labels} />
    </div>
  );
}
