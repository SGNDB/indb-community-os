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
