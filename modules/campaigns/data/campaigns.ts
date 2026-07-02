import {createClient} from "@/lib/supabase/server";
import type {SupportCampaign, SupportCampaignStatus, SupportPhoto, SupportUpdate} from "@/modules/campaigns/types";

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

const DEFAULT_VISUAL = {tone: "from-primary", accent: "to-rose-100", pattern: "bg-muted"};

const CAMPAIGN_VISUALS: Record<string, SupportCampaign["visual"]> = {
  water: {tone: "from-sky-500", accent: "to-cyan-200", pattern: "bg-sky-50"},
  education: {tone: "from-amber-500", accent: "to-yellow-100", pattern: "bg-amber-50"},
  families: {tone: "from-rose-500", accent: "to-orange-100", pattern: "bg-rose-50"},
  "clean-nouadhibou": {tone: "from-emerald-500", accent: "to-lime-100", pattern: "bg-emerald-50"},
  health: {tone: "from-red-500", accent: "to-teal-100", pattern: "bg-red-50"},
};

function normalizeCampaign(row: Record<string, unknown>): SupportCampaign {
  const slug = String(row.slug ?? "");
  const createdAt = typeof row.created_at === "string" ? row.created_at : "1970-01-01T00:00:00.000Z";
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : createdAt;
  return {
    id: String(row.id ?? ""),
    slug,
    emoji: String(row.emoji ?? "🤝"),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    long_description: String(row.long_description ?? row.description ?? ""),
    goal_amount: Number(row.goal_amount ?? 0),
    raised_amount: Number(row.raised_amount ?? 0),
    contributors_count: Number(row.contributors_count ?? 0),
    volunteers_count: Number(row.volunteers_count ?? 0),
    status: ["upcoming", "active", "paused", "completed", "archived"].includes(String(row.status))
      ? row.status as SupportCampaignStatus
      : "upcoming",
    organizer: String(row.organizer ?? "I ❤️ NDB"),
    verified: Boolean(row.verified ?? false),
    starts_at: String(row.starts_at ?? createdAt),
    ends_at: String(row.ends_at ?? createdAt),
    last_update_at: String(row.last_update_at ?? updatedAt),
    material_needs: normalizeStringArray(row.material_needs),
    impact_points: normalizeStringArray(row.impact_points),
    final_report: typeof row.final_report === "string" ? row.final_report : null,
    visual: CAMPAIGN_VISUALS[slug] ?? DEFAULT_VISUAL,
  };
}

export function getCampaignProgress(campaign: Pick<SupportCampaign, "goal_amount" | "raised_amount">) {
  if (campaign.goal_amount <= 0) return 0;
  return Math.min(100, Math.round((campaign.raised_amount / campaign.goal_amount) * 100));
}

export function getDaysRemaining(campaign: Pick<SupportCampaign, "ends_at" | "status">) {
  if (campaign.status === "completed") return 0;
  const ms = new Date(campaign.ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export async function getSupportCampaigns(): Promise<SupportCampaign[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("support_campaigns")
    .select("*")
    .order("sort_order", {ascending: true});

  if (error) {
    if (error) console.error("getSupportCampaigns error:", error);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeCampaign);
}

export async function getSupportCampaignBySlug(slug: string) {
  const campaigns = await getSupportCampaigns();
  const campaign = campaigns.find((item) => item.slug === slug) ?? null;
  if (!campaign) return null;

  const supabase = await createClient();
  const [{data: updates, error: updatesError}, {data: photos, error: photosError}] = await Promise.all([
    supabase
      .from("support_campaign_updates")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", {ascending: false}),
    supabase
      .from("support_campaign_photos")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", {ascending: false}),
  ]);

  if (updatesError || photosError) {
    if (updatesError) console.error("getSupportCampaign updates error:", updatesError);
    if (photosError) console.error("getSupportCampaign photos error:", photosError);
    return {
      campaign,
      updates: [],
      photos: [],
    };
  }

  return {
    campaign,
    updates: (updates ?? []) as SupportUpdate[],
    photos: (photos ?? []) as SupportPhoto[],
  };
}

export async function getLatestSupportUpdates(limit = 3): Promise<SupportUpdate[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("support_campaign_updates")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(limit);

  if (error) {
    console.error("getLatestSupportUpdates error:", error);
    return [];
  }

  return (data ?? []) as SupportUpdate[];
}

export async function getSupportImpact() {
  const campaigns = await getSupportCampaigns();
  return {
    totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raised_amount, 0),
    contributors: campaigns.reduce((sum, campaign) => sum + campaign.contributors_count, 0),
    completed: campaigns.filter((campaign) => campaign.status === "completed").length,
  };
}

export async function getSupportNavCounts() {
  const supabase = await createClient();
  const {count, error} = await supabase
    .from("support_campaigns")
    .select("*", {count: "exact", head: true})
    .eq("status", "active");

  if (error) console.error("getSupportNavCounts error:", error);
  const activeCampaigns = error ? 0 : count ?? 0;

  return {
    activeCampaigns,
    openVolunteerOpportunities: activeCampaigns,
  };
}
