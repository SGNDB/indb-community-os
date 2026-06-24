import {createClient} from "@/lib/supabase/server";
import {getTranslations} from "next-intl/server";
import {AdminGraatekClient, type GraatekAdminItem, type GraatekRequest} from "./admin-graatek-client";

type ProfileSummary = {id: string; full_name: string | null; username: string | null; avatar_url: string | null};

function singleProfile(value: unknown): ProfileSummary | null {
  if (Array.isArray(value)) return (value[0] as ProfileSummary | undefined) ?? null;
  return (value as ProfileSummary | null) ?? null;
}

export default async function AdminGraatekPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const t = await getTranslations({locale, namespace: "Admin"});

  const readLabel = (key: string, fallback: string) => {
    try {
      return t(`graatekPage.${key}`);
    } catch {
      return fallback;
    }
  };

  const labels = {
    eyebrow: readLabel("eyebrow", "Community sharing"),
    title: readLabel("title", "Graatek Management"),
    description: readLabel("description", "Manage and analyze community sharing activities."),
    exportCSV: readLabel("exportCSV", "Export CSV"),
    exportExcel: readLabel("exportExcel", "Export Excel"),
    exportPDF: readLabel("exportPDF", "Export PDF"),
    search: readLabel("search", "Search by title, owner, or category..."),
    filters: readLabel("filters", "Filters"),
    allStatuses: readLabel("allStatuses", "All statuses"),
    allCategories: readLabel("allCategories", "All categories"),
    totalItems: readLabel("totalItems", "Total Graatek Items"),
    activeListings: readLabel("activeListings", "Active Listings"),
    successfulExchanges: readLabel("successfulExchanges", "Successful Exchanges"),
    reservedItems: readLabel("reservedItems", "Reserved Items"),
    completionRate: readLabel("completionRate", "Completion Rate"),
    peopleHelped: readLabel("peopleHelped", "People Helped"),
    createdOverTime: readLabel("createdOverTime", "Graatek created over time"),
    successfulExchangesChart: readLabel("successfulExchangesChart", "Successful exchanges"),
    categoryGrowth: readLabel("categoryGrowth", "Category growth"),
    communityDemand: readLabel("communityDemand", "Community demand"),
    directory: readLabel("directory", "Graatek Directory"),
    impact: readLabel("impact", "Community Impact"),
    needs: readLabel("needs", "Community Needs"),
    reports: readLabel("reports", "Reports"),
    moderation: readLabel("moderation", "Moderation"),
    futureMap: readLabel("futureMap", "Future sharing heat map"),
    pendingRequests: readLabel("pendingRequests", "Pending Requests"),
    acceptedRequest: readLabel("acceptedRequest", "Accepted Request"),
    rejectedRequests: readLabel("rejectedRequests", "Rejected Requests"),
    avgTime: readLabel("avgTime", "Average time to complete"),
    tableImage: readLabel("tableImage", "Image"),
    tableTitle: readLabel("tableTitle", "Title"),
    tableCategory: readLabel("tableCategory", "Category"),
    tableOwner: readLabel("tableOwner", "Owner"),
    tableStatus: readLabel("tableStatus", "Status"),
    tableRequests: readLabel("tableRequests", "Requests"),
    tableViews: readLabel("tableViews", "Views"),
    tableCreated: readLabel("tableCreated", "Created Date"),
    tableCompleted: readLabel("tableCompleted", "Completion Date"),
    available: readLabel("available", "Available"),
    requested: readLabel("requested", "Requested"),
    reserved: readLabel("reserved", "Reserved"),
    completed: readLabel("completed", "Completed"),
    archived: readLabel("archived", "Archived"),
    viewListing: readLabel("viewListing", "View Listing"),
    archive: readLabel("archive", "Archive"),
    remove: readLabel("remove", "Remove"),
    resolveReports: readLabel("resolveReports", "Resolve Reports"),
    investigate: readLabel("investigate", "Investigate Abuse"),
    detailTitle: readLabel("detailTitle", "Listing details"),
    noResults: readLabel("noResults", "No Graatek items found."),
    periodToday: readLabel("periodToday", "Today"),
    period7d: readLabel("period7d", "7 Days"),
    period30d: readLabel("period30d", "30 Days"),
    period90d: readLabel("period90d", "90 Days"),
    period1y: readLabel("period1y", "1 Year"),
    periodAll: readLabel("periodAll", "All Time"),
    smartFilters: readLabel("smartFilters", "Smart filters"),
    mostRequested: readLabel("mostRequested", "Most Requested"),
    recentlyCreated: readLabel("recentlyCreated", "Recently Created"),
    mapReady: readLabel("mapReady", "Neighborhood heat map ready"),
    mapDescription: readLabel("mapDescription", "Location fields are preserved for future city demand analytics."),
    reportMostSharedCategories: readLabel("reportMostSharedCategories", "Most Shared Categories"),
    reportMonthlySharing: readLabel("reportMonthlySharing", "Monthly Sharing"),
    reportCommunityImpact: readLabel("reportCommunityImpact", "Community Impact"),
    reportSuccessfulExchanges: readLabel("reportSuccessfulExchanges", "Successful Exchanges"),
    shortages: readLabel("shortages", "Shortages"),
    noShortageSignals: readLabel("noShortageSignals", "No shortage signals yet."),
    unfulfilledItems: readLabel("unfulfilledItems", "Unfulfilled items"),
    noUnfulfilledRequests: readLabel("noUnfulfilledRequests", "No unfulfilled requests."),
    requestManagement: readLabel("requestManagement", "Request management"),
    messages: readLabel("messages", "Messages"),
    unknown: readLabel("unknown", "Unknown"),
    dayShort: readLabel("dayShort", "d"),
    categoryFood: readLabel("categoryFood", "Food"),
    categoryClothes: readLabel("categoryClothes", "Clothing"),
    categoryBooks: readLabel("categoryBooks", "Books"),
    categorySchoolSupplies: readLabel("categorySchoolSupplies", "School supplies"),
    categoryFurniture: readLabel("categoryFurniture", "Furniture"),
    categoryTools: readLabel("categoryTools", "Tools"),
    categoryElectronics: readLabel("categoryElectronics", "Electronics"),
    categoryMedical: readLabel("categoryMedical", "Medical equipment"),
    categoryHousehold: readLabel("categoryHousehold", "Household items"),
    categoryBabyItems: readLabel("categoryBabyItems", "Baby items"),
    categoryServices: readLabel("categoryServices", "Services"),
    categoryOther: readLabel("categoryOther", "Other"),
  };

  const {data: rawItems} = await supabase
    .from("community_shares")
    .select(`
      id, owner_id, title, description, content_language, category, condition, location,
      status, images, shares_count, accepted_request_id, created_at, updated_at,
      completed_at, archived_at, receiver_confirmed_at, sender_confirmed_at,
      owner:profiles!community_shares_owner_id_fkey(id, full_name, username, avatar_url)
    `)
    .order("created_at", {ascending: false})
    .limit(500);

  const itemRows = (rawItems ?? []) as Array<Record<string, unknown>>;
  const itemIds = itemRows.map((item) => item.id).filter((id): id is string => typeof id === "string");

  const {data: rawRequests} = itemIds.length
    ? await supabase
      .from("community_share_requests")
      .select(`
        id, share_id, requester_id, message, status, collected_at, handed_over_at, created_at, updated_at,
        requester:profiles!community_share_requests_requester_id_fkey(id, full_name, username, avatar_url)
      `)
      .in("share_id", itemIds)
    : {data: []};

  const requestRows = (rawRequests ?? []) as Array<Record<string, unknown>>;
  const requestIds = requestRows.map((request) => request.id).filter((id): id is string => typeof id === "string");

  const {data: rawMessages} = requestIds.length
    ? await supabase
      .from("fadla_request_messages")
      .select("id, share_id, request_id")
      .in("request_id", requestIds)
    : {data: []};

  const messagesByShare = new Map<string, number>();
  for (const message of (rawMessages ?? []) as Array<{share_id: string | null}>) {
    if (!message.share_id) continue;
    messagesByShare.set(message.share_id, (messagesByShare.get(message.share_id) ?? 0) + 1);
  }

  const requestsByShare = new Map<string, GraatekRequest[]>();
  for (const request of requestRows) {
    const shareId = String(request.share_id ?? "");
    if (!shareId) continue;
    const mapped: GraatekRequest = {
      id: String(request.id),
      share_id: shareId,
      requester_id: String(request.requester_id ?? ""),
      message: typeof request.message === "string" ? request.message : null,
      status: typeof request.status === "string" ? request.status : "pending",
      collected_at: typeof request.collected_at === "string" ? request.collected_at : null,
      handed_over_at: typeof request.handed_over_at === "string" ? request.handed_over_at : null,
      created_at: String(request.created_at ?? ""),
      updated_at: String(request.updated_at ?? ""),
      requester: singleProfile(request.requester),
    };
    requestsByShare.set(shareId, [...(requestsByShare.get(shareId) ?? []), mapped]);
  }

  const graatekItems: GraatekAdminItem[] = itemRows.map((item) => {
    const id = String(item.id);
    const requests = requestsByShare.get(id) ?? [];
    const acceptedRequest = requests.find((request) => request.id === item.accepted_request_id) ?? requests.find((request) => request.status === "accepted") ?? null;
    return {
      id,
      owner_id: String(item.owner_id ?? ""),
      title: String(item.title ?? ""),
      description: typeof item.description === "string" ? item.description : null,
      category: typeof item.category === "string" ? item.category : "other",
      condition: typeof item.condition === "string" ? item.condition : null,
      location: typeof item.location === "string" ? item.location : null,
      status: typeof item.status === "string" ? item.status : "published",
      images: Array.isArray(item.images) ? item.images : [],
      shares_count: typeof item.shares_count === "number" ? item.shares_count : 0,
      accepted_request_id: typeof item.accepted_request_id === "string" ? item.accepted_request_id : null,
      created_at: String(item.created_at ?? ""),
      updated_at: String(item.updated_at ?? ""),
      completed_at: typeof item.completed_at === "string" ? item.completed_at : null,
      archived_at: typeof item.archived_at === "string" ? item.archived_at : null,
      receiver_confirmed_at: typeof item.receiver_confirmed_at === "string" ? item.receiver_confirmed_at : null,
      sender_confirmed_at: typeof item.sender_confirmed_at === "string" ? item.sender_confirmed_at : null,
      owner: singleProfile(item.owner),
      requests,
      accepted_request: acceptedRequest,
      requests_count: requests.length,
      pending_requests: requests.filter((request) => request.status === "pending").length,
      rejected_requests: requests.filter((request) => request.status === "declined").length,
      messages_count: messagesByShare.get(id) ?? 0,
      views_count: Math.max(Number(item.shares_count ?? 0), requests.length * 3),
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminGraatekClient initialItems={graatekItems} labels={labels} locale={locale} />
    </div>
  );
}
