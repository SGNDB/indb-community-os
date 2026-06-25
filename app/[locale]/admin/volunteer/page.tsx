import {getTranslations} from "next-intl/server";

import {AdminVolunteerClient, type AdminVolunteerRequest} from "./admin-volunteer-client";
import {getAdminSupportCampaigns} from "@/lib/data/support";
import {createAdminClient} from "@/lib/supabase/admin";

const volunteerLabelKeys = [
  "eyebrow",
  "title",
  "description",
  "totalVolunteers",
  "activeOpportunities",
  "pendingApplications",
  "completedActivities",
  "volunteerHours",
  "monthlyGrowth",
  "today",
  "days7",
  "days30",
  "days90",
  "year1",
  "allTime",
  "analytics",
  "volunteerGrowthOverTime",
  "volunteerHoursByMonth",
  "opportunitiesByCategory",
  "participationRate",
  "completedVsActive",
  "opportunitiesTitle",
  "opportunitiesDescription",
  "applicationsTitle",
  "applicationsDescription",
  "attendanceTitle",
  "attendanceDescription",
  "profilesTitle",
  "impactTitle",
  "organizersTitle",
  "updatesTitle",
  "notificationsTitle",
  "opportunity",
  "category",
  "organizer",
  "location",
  "date",
  "volunteersNeeded",
  "volunteersJoined",
  "progress",
  "status",
  "actions",
  "view",
  "edit",
  "approve",
  "close",
  "cancel",
  "export",
  "accept",
  "reject",
  "waitlist",
  "messageApplicant",
  "applicant",
  "skills",
  "message",
  "submitted",
  "attended",
  "absent",
  "late",
  "completedHours",
  "name",
  "phone",
  "language",
  "joinedOpportunities",
  "completedActivitiesLabel",
  "totalHours",
  "reliabilityScore",
  "badges",
  "communityHelper",
  "cleanupVolunteer",
  "educationSupporter",
  "familySupport",
  "healthSupport",
  "peopleHelped",
  "neighborhoodsServed",
  "activitiesCompleted",
  "activeOrganizers",
  "recurringVolunteers",
  "verifiedOrganizers",
  "createOpportunities",
  "manageVolunteers",
  "markAttendance",
  "publishUpdates",
  "approveOrganizer",
  "revokeOrganizer",
  "reviewActivity",
  "monthlyReport",
  "attendanceReport",
  "hoursReport",
  "opportunityReport",
  "noApplications",
  "unknownVolunteer",
  "notAvailable",
  "statusOpen",
  "statusFull",
  "statusInProgress",
  "statusCompleted",
  "statusCancelled",
  "statusArchived",
  "statusPending",
  "statusVerified",
  "statusRejected",
  "statusRefunded",
  "categoryEnvironment",
  "categoryEducation",
  "categoryFamilies",
  "categoryHealth",
  "categoryCommunity",
  "categoryYouthSports",
  "campaignWater",
  "campaignEducation",
  "campaignFamilies",
  "campaignClean",
  "campaignHealth",
  "exportCSV",
  "exportExcel",
  "exportPDF",
  "exportTitle",
  "statusVolunteerVerified",
  "statusVolunteerRejected",
  "statusVolunteerRefunded",
] as const;

async function getVolunteerRequests(): Promise<AdminVolunteerRequest[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const {data, error} = await admin
    .from("support_contributions")
    .select(`
      id,
      campaign_id,
      contributor_id,
      volunteer_message,
      status,
      created_at,
      updated_at,
      campaign:support_campaigns(id, slug, emoji, title, status, volunteers_count, last_update_at),
      contributor:profiles(id, full_name, username, avatar_url)
    `)
    .eq("contribution_type", "volunteer")
    .order("created_at", {ascending: false})
    .limit(100);

  if (error) {
    console.error("getVolunteerRequests error:", error);
    return [];
  }

  return (data ?? []).map((item) => ({
    ...item,
    campaign: Array.isArray(item.campaign) ? item.campaign[0] ?? null : item.campaign,
    contributor: Array.isArray(item.contributor) ? item.contributor[0] ?? null : item.contributor,
  })) as AdminVolunteerRequest[];
}

export default async function AdminVolunteerPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin.volunteeringPage"});
  const [campaigns, requests] = await Promise.all([
    getAdminSupportCampaigns(),
    getVolunteerRequests(),
  ]);
  const labels = Object.fromEntries(volunteerLabelKeys.map((key) => [key, t(key)]));

  return (
    <AdminVolunteerClient
      locale={locale}
      status={status ?? null}
      labels={labels}
      campaigns={campaigns}
      requests={requests}
    />
  );
}
