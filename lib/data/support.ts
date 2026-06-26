import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";

export type SupportCampaignStatus = "upcoming" | "active" | "paused" | "completed" | "archived";
export type SupportContributionType = "money" | "volunteer" | "materials";
export type SupportPaymentMethod = "bankily" | "masrivi" | "sedad" | "card";
export type SupportDonationStatus = "pending" | "verified" | "rejected" | "refunded";

export interface SupportCampaign {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string;
  long_description: string;
  goal_amount: number;
  raised_amount: number;
  contributors_count: number;
  volunteers_count: number;
  status: SupportCampaignStatus;
  organizer: string;
  verified: boolean;
  starts_at: string;
  ends_at: string;
  last_update_at: string;
  material_needs: string[];
  impact_points: string[];
  final_report: string | null;
  visual: {
    tone: string;
    accent: string;
    pattern: string;
  };
}

export interface SupportUpdate {
  id: string;
  campaign_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface SupportPhoto {
  id: string;
  campaign_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export interface SupportContribution {
  id: string;
  campaign_id: string;
  contributor_id: string | null;
  contribution_type: SupportContributionType;
  amount: number | null;
  payment_method: SupportPaymentMethod | null;
  transaction_id: string | null;
  receipt_url: string | null;
  receipt_storage_path: string | null;
  material_description: string | null;
  volunteer_message: string | null;
  status: SupportDonationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Pick<SupportCampaign, "id" | "slug" | "emoji" | "title" | "raised_amount" | "contributors_count"> | null;
  contributor?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SupportPaymentReceiver {
  method: SupportPaymentMethod;
  label: string;
  receiverLabel: string;
  receiverValue: string;
  configured: boolean;
  cardReady?: boolean;
}

export const SUPPORT_CAMPAIGN_SLUGS = [
  "water",
  "education",
  "families",
  "clean-nouadhibou",
  "health",
] as const;

const DEFAULT_RECEIVER_TEXT = "I ❤️ NDB official receiver will be configured before public payment launch.";

export function getSupportPaymentReceivers(): SupportPaymentReceiver[] {
  return [
    {
      method: "bankily",
      label: "Bankily",
      receiverLabel: "Official Bankily number/account",
      receiverValue: process.env.SUPPORT_BANKILY_RECEIVER ?? DEFAULT_RECEIVER_TEXT,
      configured: Boolean(process.env.SUPPORT_BANKILY_RECEIVER),
    },
    {
      method: "masrivi",
      label: "Masrivi",
      receiverLabel: "Official Masrivi number/account",
      receiverValue: process.env.SUPPORT_MASRIVI_RECEIVER ?? DEFAULT_RECEIVER_TEXT,
      configured: Boolean(process.env.SUPPORT_MASRIVI_RECEIVER),
    },
    {
      method: "sedad",
      label: "Sedad",
      receiverLabel: "Official Sedad number/account",
      receiverValue: process.env.SUPPORT_SEDAD_RECEIVER ?? DEFAULT_RECEIVER_TEXT,
      configured: Boolean(process.env.SUPPORT_SEDAD_RECEIVER),
    },
    {
      method: "card",
      label: "Visa / Mastercard",
      receiverLabel: "Card provider",
      receiverValue: process.env.SUPPORT_CARD_PROVIDER_NAME ?? "Coming soon",
      configured: Boolean(process.env.SUPPORT_CARD_PROVIDER_READY === "true" && process.env.SUPPORT_CARD_PROVIDER_NAME),
      cardReady: process.env.SUPPORT_CARD_PROVIDER_READY === "true",
    },
  ];
}

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

export async function recordSupportContribution(input: {
  campaignId: string;
  userId: string | null;
  contributionType: SupportContributionType;
  amount?: number | null;
  paymentMethod?: SupportPaymentMethod | null;
  transactionId?: string | null;
  receiptUrl?: string | null;
  receiptStoragePath?: string | null;
  materialDescription?: string | null;
  volunteerMessage?: string | null;
}) {
  const supabase = await createClient();
  const {error} = await supabase.from("support_contributions").insert({
    campaign_id: input.campaignId,
    contributor_id: input.userId,
    contribution_type: input.contributionType,
    amount: input.amount ?? null,
    payment_method: input.paymentMethod ?? null,
    transaction_id: input.transactionId ?? null,
    receipt_url: input.receiptUrl ?? null,
    receipt_storage_path: input.receiptStoragePath ?? null,
    material_description: input.materialDescription ?? null,
    volunteer_message: input.volunteerMessage ?? null,
    status: "pending",
  });

  if (error) {
    console.error("recordSupportContribution error:", error);
    return false;
  }

  return true;
}

export async function getAdminSupportCampaigns() {
  return getSupportCampaigns();
}

export async function getAdminSupportContributions(): Promise<SupportContribution[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const {data, error} = await admin
    .from("support_contributions")
    .select(`
      *,
      campaign:support_campaigns(id, slug, emoji, title, raised_amount, contributors_count),
      contributor:profiles(id, full_name, username, avatar_url)
    `)
    .eq("contribution_type", "money")
    .order("created_at", {ascending: false})
    .limit(100);

  if (error) {
    console.error("getAdminSupportContributions error:", error);
    return [];
  }

  const contributions = (data ?? []) as SupportContribution[];

  return Promise.all(
    contributions.map(async (contribution) => {
      if (!contribution.receipt_storage_path) return contribution;
      const {data: signed} = await admin.storage
        .from("support-receipts")
        .createSignedUrl(contribution.receipt_storage_path, 60 * 10);
      return {
        ...contribution,
        receipt_url: signed?.signedUrl ?? contribution.receipt_url,
      };
    }),
  );
}

export async function adminSetSupportContributionStatus(input: {
  contributionId: string;
  adminId: string;
  status: Exclude<SupportDonationStatus, "pending">;
  rejectedReason?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return false;

  const {error} = await admin.rpc("admin_set_support_contribution_status", {
    p_contribution_id: input.contributionId,
    p_admin_id: input.adminId,
    p_status: input.status,
    p_rejected_reason: input.rejectedReason ?? null,
  });

  if (error) {
    console.error("adminSetSupportContributionStatus error:", error);
    return false;
  }

  return true;
}

export async function adminUpdateSupportCampaign(input: {
  campaignId: string;
  raisedAmount: number;
  contributorsCount: number;
  volunteersCount: number;
  status: SupportCampaignStatus;
  finalReport: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return false;

  const {error} = await admin
    .from("support_campaigns")
    .update({
      raised_amount: input.raisedAmount,
      contributors_count: input.contributorsCount,
      volunteers_count: input.volunteersCount,
      status: input.status,
      final_report: input.finalReport,
      last_update_at: new Date().toISOString(),
    })
    .eq("id", input.campaignId);

  if (error) {
    console.error("adminUpdateSupportCampaign error:", error);
    return false;
  }

  return true;
}

export async function adminCreateSupportCampaign(input: {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  longDescription: string;
  goalAmount: number;
  endsAt: string;
}) {
  const admin = createAdminClient();
  if (!admin) return false;

  const {count} = await admin
    .from("support_campaigns")
    .select("*", {count: "exact", head: true});

  const {error} = await admin.from("support_campaigns").insert({
    slug: input.slug,
    emoji: input.emoji,
    title: input.title,
    description: input.description,
    long_description: input.longDescription,
    goal_amount: input.goalAmount,
    raised_amount: 0,
    contributors_count: 0,
    volunteers_count: 0,
    status: "active",
    organizer: "I ❤️ NDB",
    verified: true,
    starts_at: new Date().toISOString(),
    ends_at: input.endsAt,
    last_update_at: new Date().toISOString(),
    material_needs: [],
    impact_points: [],
    sort_order: (count ?? 0) + 1,
  });

  if (error) {
    console.error("adminCreateSupportCampaign error:", error);
    return false;
  }

  return true;
}

export async function adminCreateSupportUpdate(input: {
  campaignId: string;
  title: string;
  body: string;
}) {
  const admin = createAdminClient();
  if (!admin) return false;

  const {error} = await admin.from("support_campaign_updates").insert({
    campaign_id: input.campaignId,
    title: input.title,
    body: input.body,
  });

  if (error) {
    console.error("adminCreateSupportUpdate error:", error);
    return false;
  }

  return true;
}
