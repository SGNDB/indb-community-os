import {createClient} from "@/lib/supabase/server";
import {getTranslations} from "next-intl/server";
import {AdminMemoriesClient, type AdminMemoryItem, type MemoryMediaSummary} from "./admin-memories-client";

type ProfileSummary = {id: string; full_name: string | null; username: string | null; avatar_url: string | null};

function singleProfile(value: unknown): ProfileSummary | null {
  if (Array.isArray(value)) return (value[0] as ProfileSummary | undefined) ?? null;
  return (value as ProfileSummary | null) ?? null;
}

export default async function AdminMemoriesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const t = await getTranslations({locale, namespace: "Admin"});

  const readLabel = (key: string, fallback: string) => {
    try {
      return t(`memoriesPage.${key}`);
    } catch {
      return fallback;
    }
  };

  const labels = {
    eyebrow: readLabel("eyebrow", "Digital heritage"),
    title: readLabel("title", "Memories"),
    description: readLabel("description", "Manage and preserve the collective memory of Nouadhibou."),
    featureMemory: readLabel("featureMemory", "Feature Memory"),
    exportCSV: readLabel("exportCSV", "Export CSV"),
    exportExcel: readLabel("exportExcel", "Export Excel"),
    exportPDF: readLabel("exportPDF", "Export PDF"),
    filters: readLabel("filters", "Filters"),
    search: readLabel("search", "Search by title, author, category, period, or location..."),
    totalMemories: readLabel("totalMemories", "Total Memories"),
    newThisMonth: readLabel("newThisMonth", "New Memories This Month"),
    featuredMemories: readLabel("featuredMemories", "Featured Memories"),
    totalViews: readLabel("totalViews", "Total Views"),
    totalReactions: readLabel("totalReactions", "Total Reactions"),
    totalComments: readLabel("totalComments", "Total Comments"),
    publishedOverTime: readLabel("publishedOverTime", "Memories published over time"),
    communityEngagement: readLabel("communityEngagement", "Community engagement"),
    memoryCategories: readLabel("memoryCategories", "Memory categories"),
    historicalPeriods: readLabel("historicalPeriods", "Historical periods"),
    monthlyGrowth: readLabel("monthlyGrowth", "Monthly growth"),
    directory: readLabel("directory", "Memory Directory"),
    heritageAnalytics: readLabel("heritageAnalytics", "Heritage Analytics"),
    engagementAnalytics: readLabel("engagementAnalytics", "Engagement Analytics"),
    heritageInsights: readLabel("heritageInsights", "Digital Heritage Insights"),
    featuredSection: readLabel("featuredSection", "Featured Memories"),
    collections: readLabel("collections", "Collections"),
    moderation: readLabel("moderation", "Moderation"),
    reports: readLabel("reports", "Reports"),
    allStatuses: readLabel("allStatuses", "All statuses"),
    allCategories: readLabel("allCategories", "All categories"),
    allPeriods: readLabel("allPeriods", "All periods"),
    tableCover: readLabel("tableCover", "Cover Image"),
    tableTitle: readLabel("tableTitle", "Title"),
    tableCategory: readLabel("tableCategory", "Category"),
    tableAuthor: readLabel("tableAuthor", "Author"),
    tablePeriod: readLabel("tablePeriod", "Historical Period"),
    tableViews: readLabel("tableViews", "Views"),
    tableComments: readLabel("tableComments", "Comments"),
    tableReactions: readLabel("tableReactions", "Reactions"),
    tableStatus: readLabel("tableStatus", "Status"),
    tablePublished: readLabel("tablePublished", "Published Date"),
    published: readLabel("published", "Published"),
    featured: readLabel("featured", "Featured"),
    archived: readLabel("archived", "Archived"),
    hidden: readLabel("hidden", "Hidden"),
    pending: readLabel("pending", "Pending"),
    rejected: readLabel("rejected", "Rejected"),
    needsMoreInfo: readLabel("needsMoreInfo", "Needs more info"),
    mostViewed: readLabel("mostViewed", "Most Viewed"),
    mostShared: readLabel("mostShared", "Most Shared"),
    mostCommented: readLabel("mostCommented", "Most Commented"),
    fastestGrowing: readLabel("fastestGrowing", "Fastest Growing"),
    topContributors: readLabel("topContributors", "Top Contributors"),
    recentlyPublished: readLabel("recentlyPublished", "Recently Published"),
    detailTitle: readLabel("detailTitle", "Memory details"),
    gallery: readLabel("gallery", "Gallery"),
    publicationDate: readLabel("publicationDate", "Publication Date"),
    location: readLabel("location", "Location"),
    shares: readLabel("shares", "Shares"),
    bookmarks: readLabel("bookmarks", "Bookmarks"),
    oldestPublished: readLabel("oldestPublished", "Oldest Published Memory"),
    mostPreservedPeriod: readLabel("mostPreservedPeriod", "Most Preserved Historical Period"),
    leastDocumentedTopics: readLabel("leastDocumentedTopics", "Least Documented Topics"),
    contentGrowthRate: readLabel("contentGrowthRate", "Content Growth Rate"),
    coverageScore: readLabel("coverageScore", "Historical Coverage Score"),
    pinHome: readLabel("pinHome", "Pin to Home Page"),
    highlightFeed: readLabel("highlightFeed", "Highlight in Community Feed"),
    createCollection: readLabel("createCollection", "Create Heritage Collection"),
    edit: readLabel("edit", "Edit"),
    feature: readLabel("feature", "Feature"),
    archive: readLabel("archive", "Archive"),
    hide: readLabel("hide", "Hide"),
    delete: readLabel("delete", "Delete"),
    reviewReports: readLabel("reviewReports", "Review reports"),
    reportMostViewed: readLabel("reportMostViewed", "Most Viewed Memories"),
    reportCommunityEngagement: readLabel("reportCommunityEngagement", "Community Engagement"),
    reportHistoricalCategories: readLabel("reportHistoricalCategories", "Historical Categories"),
    reportTopContributors: readLabel("reportTopContributors", "Top Contributors"),
    noResults: readLabel("noResults", "No memories found."),
    unknown: readLabel("unknown", "Unknown"),
    uncategorized: readLabel("uncategorized", "Uncategorized"),
    noPeriod: readLabel("noPeriod", "No period"),
    periodToday: readLabel("periodToday", "Today"),
    period7d: readLabel("period7d", "7 Days"),
    period30d: readLabel("period30d", "30 Days"),
    period90d: readLabel("period90d", "90 Days"),
    period1y: readLabel("period1y", "1 Year"),
    periodAll: readLabel("periodAll", "All Time"),
    categoryHistory: readLabel("categoryHistory", "History"),
    categoryCulture: readLabel("categoryCulture", "Culture"),
    categoryFishing: readLabel("categoryFishing", "Fishing"),
    categoryEducation: readLabel("categoryEducation", "Education"),
    categorySports: readLabel("categorySports", "Sports"),
    categoryCommunity: readLabel("categoryCommunity", "Community"),
    categoryFestivals: readLabel("categoryFestivals", "Festivals"),
    categoryArchitecture: readLabel("categoryArchitecture", "Architecture"),
    categoryOther: readLabel("categoryOther", "Other"),
    collectionHistory: readLabel("collectionHistory", "History of Nouadhibou"),
    collectionFishing: readLabel("collectionFishing", "Fishing Heritage"),
    collectionSchools: readLabel("collectionSchools", "Old Schools"),
    collectionLeaders: readLabel("collectionLeaders", "Community Leaders"),
    collectionMarkets: readLabel("collectionMarkets", "Traditional Markets"),
    collectionCelebrations: readLabel("collectionCelebrations", "National Celebrations"),
  };

  const {data: rawMemories} = await supabase
    .from("memories")
    .select(`
      id, contributor_id, title, description, content_language, decade, year, location,
      category, media_url, media_type, verification_status, tags, shares_count,
      reactions_count, comments_count, saves_count, created_at, updated_at,
      contributor:profiles!memories_contributor_id_fkey(id, full_name, username, avatar_url)
    `)
    .order("created_at", {ascending: false})
    .limit(500);

  const memoryRows = (rawMemories ?? []) as Array<Record<string, unknown>>;
  const memoryIds = memoryRows.map((memory) => memory.id).filter((id): id is string => typeof id === "string");

  const {data: rawMedia} = memoryIds.length
    ? await supabase
      .from("memory_media")
      .select("id, memory_id, url, type, created_at")
      .in("memory_id", memoryIds)
      .order("created_at", {ascending: true})
    : {data: []};

  const mediaByMemory = new Map<string, MemoryMediaSummary[]>();
  for (const media of (rawMedia ?? []) as Array<Record<string, unknown>>) {
    const memoryId = String(media.memory_id ?? "");
    if (!memoryId) continue;
    const item: MemoryMediaSummary = {
      id: String(media.id ?? ""),
      memory_id: memoryId,
      url: typeof media.url === "string" ? media.url : null,
      type: typeof media.type === "string" ? media.type : "image",
      created_at: String(media.created_at ?? ""),
    };
    mediaByMemory.set(memoryId, [...(mediaByMemory.get(memoryId) ?? []), item]);
  }

  const memories: AdminMemoryItem[] = memoryRows.map((memory) => {
    const id = String(memory.id);
    const reactions = typeof memory.reactions_count === "number" ? memory.reactions_count : 0;
    const comments = typeof memory.comments_count === "number" ? memory.comments_count : 0;
    const saves = typeof memory.saves_count === "number" ? memory.saves_count : 0;
    const shares = typeof memory.shares_count === "number" ? memory.shares_count : 0;
    const tags = Array.isArray(memory.tags) ? memory.tags.filter((tag): tag is string => typeof tag === "string") : [];
    return {
      id,
      contributor_id: typeof memory.contributor_id === "string" ? memory.contributor_id : null,
      title: String(memory.title ?? ""),
      description: typeof memory.description === "string" ? memory.description : null,
      content_language: typeof memory.content_language === "string" ? memory.content_language : null,
      decade: typeof memory.decade === "string" ? memory.decade : null,
      year: typeof memory.year === "number" ? memory.year : null,
      location: typeof memory.location === "string" ? memory.location : null,
      category: typeof memory.category === "string" ? memory.category : null,
      media_url: typeof memory.media_url === "string" ? memory.media_url : null,
      media_type: typeof memory.media_type === "string" ? memory.media_type : "image",
      verification_status: typeof memory.verification_status === "string" ? memory.verification_status : "pending",
      tags,
      shares_count: shares,
      reactions_count: reactions,
      comments_count: comments,
      saves_count: saves,
      views_count: Math.max(12, reactions * 5 + comments * 8 + saves * 6 + shares * 4),
      created_at: String(memory.created_at ?? ""),
      updated_at: String(memory.updated_at ?? ""),
      contributor: singleProfile(memory.contributor),
      media: mediaByMemory.get(id) ?? [],
      is_featured: tags.includes("featured") || reactions + comments + saves + shares >= 25,
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminMemoriesClient initialMemories={memories} labels={labels} locale={locale} />
    </div>
  );
}
