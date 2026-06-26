import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";

export type CommunityLevelKey =
  | "community_supporter"
  | "active_contributor"
  | "community_builder"
  | "community_champion"
  | "guardian_of_nouadhibou";

export type CommunityImpactBadgeKey =
  | "water_supporter"
  | "family_supporter"
  | "education_supporter"
  | "health_supporter"
  | "community_cleaner"
  | "volunteer"
  | "graatek_helper"
  | "innovator"
  | "story_keeper"
  | "community_builder";

export interface CommunityImpactStats {
  user_id: string;
  donations_total: number;
  donations_count: number;
  campaigns_supported: number;
  last_donation_at: string | null;
  volunteer_hours: number;
  volunteer_activities: number;
  volunteer_attendance_rate: number;
  current_opportunities: number;
  graatek_completed: number;
  graatek_shared: number;
  graatek_people_helped: number;
  graatek_completion_rate: number;
  ideas_created: number;
  ideas_supported: number;
  ideas_completed: number;
  ideas_participants: number;
  memories_created: number;
  memories_views: number;
  memories_reactions: number;
  memories_featured: number;
  badges: CommunityImpactBadgeKey[];
  community_level: CommunityLevelKey;
  active_modules: number;
  last_updated: string;
}

export interface CommunityImpactAdminContributor {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  community_level: CommunityLevelKey;
  badges: CommunityImpactBadgeKey[];
  metric: number;
}

export interface CommunityImpactAdminSummary {
  totals: {
    volunteerHours: number;
    donationsTotal: number;
    familiesHelped: number;
    graatekCompleted: number;
    graatekSuccessRate: number;
    ideasCompleted: number;
    memoriesPublished: number;
    activeContributors: number;
  };
  top: {
    volunteers: CommunityImpactAdminContributor[];
    donors: CommunityImpactAdminContributor[];
    graatek: CommunityImpactAdminContributor[];
    builders: CommunityImpactAdminContributor[];
    memories: CommunityImpactAdminContributor[];
    ideas: CommunityImpactAdminContributor[];
  };
  growth: {label: string; value: number}[];
}

const emptyImpact = (userId: string): CommunityImpactStats => ({
  user_id: userId,
  donations_total: 0,
  donations_count: 0,
  campaigns_supported: 0,
  last_donation_at: null,
  volunteer_hours: 0,
  volunteer_activities: 0,
  volunteer_attendance_rate: 0,
  current_opportunities: 0,
  graatek_completed: 0,
  graatek_shared: 0,
  graatek_people_helped: 0,
  graatek_completion_rate: 0,
  ideas_created: 0,
  ideas_supported: 0,
  ideas_completed: 0,
  ideas_participants: 0,
  memories_created: 0,
  memories_views: 0,
  memories_reactions: 0,
  memories_featured: 0,
  badges: [],
  community_level: "community_supporter",
  active_modules: 0,
  last_updated: new Date().toISOString(),
});

function asNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeBadges(value: unknown): CommunityImpactBadgeKey[] {
  return Array.isArray(value) ? value.filter((item): item is CommunityImpactBadgeKey => typeof item === "string") : [];
}

function normalizeLevel(value: unknown): CommunityLevelKey {
  const level = typeof value === "string" ? value : "";
  if (
    level === "community_supporter" ||
    level === "active_contributor" ||
    level === "community_builder" ||
    level === "community_champion" ||
    level === "guardian_of_nouadhibou"
  ) {
    return level;
  }
  return "community_supporter";
}

function normalizeImpact(row: Record<string, unknown>, userId: string): CommunityImpactStats {
  return {
    user_id: String(row.user_id ?? userId),
    donations_total: asNumber(row.donations_total),
    donations_count: asNumber(row.donations_count),
    campaigns_supported: asNumber(row.campaigns_supported),
    last_donation_at: typeof row.last_donation_at === "string" ? row.last_donation_at : null,
    volunteer_hours: asNumber(row.volunteer_hours),
    volunteer_activities: asNumber(row.volunteer_activities),
    volunteer_attendance_rate: asNumber(row.volunteer_attendance_rate),
    current_opportunities: asNumber(row.current_opportunities),
    graatek_completed: asNumber(row.graatek_completed),
    graatek_shared: asNumber(row.graatek_shared),
    graatek_people_helped: asNumber(row.graatek_people_helped),
    graatek_completion_rate: asNumber(row.graatek_completion_rate),
    ideas_created: asNumber(row.ideas_created),
    ideas_supported: asNumber(row.ideas_supported),
    ideas_completed: asNumber(row.ideas_completed),
    ideas_participants: asNumber(row.ideas_participants),
    memories_created: asNumber(row.memories_created),
    memories_views: asNumber(row.memories_views),
    memories_reactions: asNumber(row.memories_reactions),
    memories_featured: asNumber(row.memories_featured),
    badges: normalizeBadges(row.badges),
    community_level: normalizeLevel(row.community_level),
    active_modules: asNumber(row.active_modules),
    last_updated: typeof row.last_updated === "string" ? row.last_updated : new Date().toISOString(),
  };
}

function deriveLevel(impact: CommunityImpactStats): CommunityLevelKey {
  const total =
    Math.min(impact.donations_count, 8) +
    impact.volunteer_activities +
    impact.graatek_completed +
    impact.ideas_completed +
    impact.memories_created;

  if (
    impact.active_modules >= 5 &&
    impact.volunteer_activities >= 6 &&
    impact.graatek_completed >= 6 &&
    impact.ideas_completed >= 2 &&
    impact.memories_created >= 6
  ) {
    return "guardian_of_nouadhibou";
  }
  if (impact.active_modules >= 4 && total >= 18) return "community_champion";
  if (impact.active_modules >= 3 && total >= 9) return "community_builder";
  if (impact.active_modules >= 2) return "active_contributor";
  return "community_supporter";
}

function deriveBadges(impact: CommunityImpactStats, campaignSlugs: string[]): CommunityImpactBadgeKey[] {
  const badges = new Set<CommunityImpactBadgeKey>();
  if (campaignSlugs.includes("water")) badges.add("water_supporter");
  if (campaignSlugs.includes("families")) badges.add("family_supporter");
  if (campaignSlugs.includes("education")) badges.add("education_supporter");
  if (campaignSlugs.includes("health")) badges.add("health_supporter");
  if (campaignSlugs.includes("clean-nouadhibou")) badges.add("community_cleaner");
  if (impact.volunteer_activities > 0) badges.add("volunteer");
  if (impact.graatek_completed > 0) badges.add("graatek_helper");
  if (impact.ideas_created > 0 || impact.ideas_completed > 0) badges.add("innovator");
  if (impact.memories_created > 0) badges.add("story_keeper");
  if (impact.active_modules >= 3) badges.add("community_builder");
  return [...badges];
}

async function computeCommunityImpact(userId: string): Promise<CommunityImpactStats> {
  const supabase = await createClient();
  const impact = emptyImpact(userId);

  const [
    donationsRes,
    volunteerRes,
    opportunitiesRes,
    graatekRes,
    ideasRes,
    ideaSupportRes,
    memoriesRes,
  ] = await Promise.all([
    supabase
      .from("support_contributions")
      .select("amount, campaign_id, verified_at, campaign:support_campaigns(slug)")
      .eq("contributor_id", userId)
      .eq("contribution_type", "money")
      .eq("status", "verified"),
    supabase
      .from("support_contributions")
      .select("id")
      .eq("contributor_id", userId)
      .eq("contribution_type", "volunteer")
      .eq("status", "verified"),
    supabase
      .from("support_campaigns")
      .select("*", {count: "exact", head: true})
      .eq("status", "active"),
    supabase
      .from("community_shares")
      .select("id, status")
      .eq("owner_id", userId),
    supabase
      .from("ideas")
      .select("id, status")
      .eq("author_id", userId),
    supabase
      .from("idea_supporters")
      .select("*", {count: "exact", head: true})
      .eq("user_id", userId),
    supabase
      .from("memories")
      .select("id, reactions_count, saves_count")
      .eq("contributor_id", userId)
      .eq("verification_status", "approved"),
  ]);

  const campaignSlugs = new Set<string>();
  const campaignIds = new Set<string>();
  for (const donation of donationsRes.data ?? []) {
    impact.donations_total += asNumber(donation.amount);
    impact.donations_count += 1;
    if (typeof donation.campaign_id === "string") campaignIds.add(donation.campaign_id);
    const campaign = Array.isArray(donation.campaign) ? donation.campaign[0] : donation.campaign;
    if (campaign && typeof campaign.slug === "string") campaignSlugs.add(campaign.slug);
    if (typeof donation.verified_at === "string" && (!impact.last_donation_at || donation.verified_at > impact.last_donation_at)) {
      impact.last_donation_at = donation.verified_at;
    }
  }
  impact.campaigns_supported = campaignIds.size;

  impact.volunteer_activities = volunteerRes.data?.length ?? 0;
  impact.volunteer_hours = 0;
  impact.volunteer_attendance_rate = impact.volunteer_activities > 0 ? 100 : 0;
  impact.current_opportunities = opportunitiesRes.count ?? 0;

  const graatekRows = graatekRes.data ?? [];
  const completedShareIds = graatekRows
    .filter((share) => ["completed", "archived", "given"].includes(String(share.status)))
    .map((share) => String(share.id));
  impact.graatek_shared = graatekRows.length;
  impact.graatek_completed = completedShareIds.length;
  impact.graatek_completion_rate = impact.graatek_shared > 0 ? Math.round((impact.graatek_completed / impact.graatek_shared) * 100) : 0;

  if (completedShareIds.length > 0) {
    const {data: acceptedRequests} = await supabase
      .from("community_share_requests")
      .select("requester_id")
      .in("share_id", completedShareIds)
      .eq("status", "accepted");
    impact.graatek_people_helped = new Set((acceptedRequests ?? []).map((request) => request.requester_id).filter(Boolean)).size;
  }

  const ideaRows = ideasRes.data ?? [];
  const ideaIds = ideaRows.map((idea) => String(idea.id));
  impact.ideas_created = ideaRows.length;
  impact.ideas_completed = ideaRows.filter((idea) => idea.status === "completed").length;
  impact.ideas_supported = ideaSupportRes.count ?? 0;

  if (ideaIds.length > 0) {
    const {data: ideaParticipants} = await supabase
      .from("idea_participants")
      .select("id")
      .in("idea_id", ideaIds)
      .eq("status", "accepted");
    impact.ideas_participants = ideaParticipants?.length ?? 0;
  }

  impact.memories_created = memoriesRes.data?.length ?? 0;
  impact.memories_reactions = (memoriesRes.data ?? []).reduce((sum, memory) => sum + asNumber(memory.reactions_count), 0);

  impact.active_modules =
    (impact.donations_count > 0 ? 1 : 0) +
    (impact.volunteer_activities > 0 ? 1 : 0) +
    (impact.graatek_shared > 0 || impact.graatek_completed > 0 ? 1 : 0) +
    (impact.ideas_created > 0 || impact.ideas_supported > 0 ? 1 : 0) +
    (impact.memories_created > 0 ? 1 : 0);
  impact.community_level = deriveLevel(impact);
  impact.badges = deriveBadges(impact, [...campaignSlugs]);

  return impact;
}

export async function getCommunityImpact(userId: string): Promise<CommunityImpactStats> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("community_impact_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return normalizeImpact(data as Record<string, unknown>, userId);
  }

  return computeCommunityImpact(userId);
}

function normalizeContributor(row: Record<string, unknown>, metric: number): CommunityImpactAdminContributor {
  const profile = row.profile && typeof row.profile === "object" ? row.profile as Record<string, unknown> : {};
  return {
    user_id: String(row.user_id),
    full_name: typeof profile.full_name === "string" ? profile.full_name : null,
    username: typeof profile.username === "string" ? profile.username : null,
    avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
    community_level: normalizeLevel(row.community_level),
    badges: normalizeBadges(row.badges),
    metric,
  };
}

function topBy(rows: Record<string, unknown>[], field: string): CommunityImpactAdminContributor[] {
  return [...rows]
    .sort((a, b) => asNumber(b[field]) - asNumber(a[field]))
    .filter((row) => asNumber(row[field]) > 0)
    .slice(0, 6)
    .map((row) => normalizeContributor(row, asNumber(row[field])));
}

export async function getCommunityImpactAdminSummary(): Promise<CommunityImpactAdminSummary> {
  const admin = createAdminClient();
  const fallback: CommunityImpactAdminSummary = {
    totals: {
      volunteerHours: 0,
      donationsTotal: 0,
      familiesHelped: 0,
      graatekCompleted: 0,
      graatekSuccessRate: 0,
      ideasCompleted: 0,
      memoriesPublished: 0,
      activeContributors: 0,
    },
    top: {
      volunteers: [],
      donors: [],
      graatek: [],
      builders: [],
      memories: [],
      ideas: [],
    },
    growth: [],
  };

  if (!admin) return fallback;

  const {data, error} = await admin
    .from("community_impact_stats")
    .select("*, profile:profiles(full_name, username, avatar_url)")
    .order("last_updated", {ascending: false})
    .limit(500);

  if (error || !data) {
    if (error) console.error("getCommunityImpactAdminSummary error:", error);
    return fallback;
  }

  const rows = data as Record<string, unknown>[];
  const graatekShared = rows.reduce((sum, row) => sum + asNumber(row.graatek_shared), 0);
  const graatekCompleted = rows.reduce((sum, row) => sum + asNumber(row.graatek_completed), 0);
  const growthBuckets = rows.slice(0, 90).reduce<Map<string, number>>((bucket, row) => {
    const date = typeof row.last_updated === "string" ? new Date(row.last_updated) : new Date();
    const label = date.toLocaleDateString("en-US", {month: "short", day: "numeric"});
    bucket.set(label, (bucket.get(label) ?? 0) + asNumber(row.active_modules));
    return bucket;
  }, new Map<string, number>());

  return {
    totals: {
      volunteerHours: rows.reduce((sum, row) => sum + asNumber(row.volunteer_hours), 0),
      donationsTotal: rows.reduce((sum, row) => sum + asNumber(row.donations_total), 0),
      familiesHelped: rows.reduce((sum, row) => sum + asNumber(row.graatek_people_helped), 0),
      graatekCompleted,
      graatekSuccessRate: graatekShared > 0 ? Math.round((graatekCompleted / graatekShared) * 100) : 0,
      ideasCompleted: rows.reduce((sum, row) => sum + asNumber(row.ideas_completed), 0),
      memoriesPublished: rows.reduce((sum, row) => sum + asNumber(row.memories_created), 0),
      activeContributors: rows.filter((row) => asNumber(row.active_modules) > 0).length,
    },
    top: {
      volunteers: topBy(rows, "volunteer_hours"),
      donors: topBy(rows, "donations_total"),
      graatek: topBy(rows, "graatek_completed"),
      builders: topBy(rows, "active_modules"),
      memories: topBy(rows, "memories_created"),
      ideas: topBy(rows, "ideas_completed"),
    },
    growth: [...growthBuckets.entries()].slice(0, 8).map(([label, value]) => ({label, value})),
  };
}
