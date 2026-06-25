import {getTranslations} from "next-intl/server";

import {AdminCommunicationsClient} from "./admin-communications-client";

const communicationLabelKeys = [
  "communicationsOverview", "campaignsTab", "audienceTab", "builderTab", "analyticsTab",
  "eyebrow", "title", "description", "newCampaign",
  "kpiSent", "kpiDelivered", "kpiOpened", "kpiClicked", "kpiBounceRate", "kpiEngagement",
  "actionNewsletter", "actionNewsletterDesc", "actionAnnouncement", "actionAnnouncementDesc",
  "actionSchedule", "actionScheduleDesc", "actionAudience", "actionAudienceDesc",
  "actionTemplates", "actionTemplatesDesc",
  "recentCampaigns", "viewAll", "allCampaigns",
  "campaignName", "lblSubject", "lblType", "lblAudience", "lblLanguage",
  "lblSent", "lblOpens", "lblClicks", "lblBounced", "lblOpenRate", "lblClickRate", "lblCreated",
  "status", "statusDraft", "statusScheduled", "statusSending", "statusSent", "statusFailed", "statusCancelled",
  "deliveryHealth", "recentActivity", "filterAll", "filterAllTypes",
  "audienceSegments", "audienceDesc", "segmentDetails", "totalUsers", "growth",
  "avgOpenRate", "avgClickRate", "sendToSegment",
  "emailBuilder", "createEmail", "subjectPlaceholder", "previewText", "previewPlaceholder",
  "bannerImage", "clickToUpload", "emailBody", "bodyPlaceholder",
  "ctaLabel", "ctaPlaceholder", "ctaUrl", "footerText", "footerPlaceholder",
  "scheduling", "scheduleLater", "recurring", "weekly", "monthly", "saveDraft",
  "allLanguages", "arabic", "french", "english",
  "templates", "templatesDesc",
  "emailsSentOverTime", "openClickRate", "deliverySuccess", "audienceGrowth", "topCampaigns",
  "deliveryRate", "bounceRate", "lblEngagement", "complained", "openRateShort",
  "deliveryHealthFull", "preview", "sendNow",
  "sentOverTime", "notificationTypes", "audiencePerformance", "failedNotifications",
  "notificationLog", "templatesDescription",
  "titleField", "messageField", "targetAudience", "language", "optionalLink", "scheduleTime",
  "safeConfirmation", "exportTitle",
] as const;

export default async function AdminNotificationsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin.notificationsPage"});
  const labels = Object.fromEntries(communicationLabelKeys.map((key) => [key, t(key)]));

  return <AdminCommunicationsClient locale={locale} labels={labels} />;
}
