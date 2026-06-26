export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
export type CampaignType =
  | "welcome" | "verification" | "newsletter" | "campaign_update"
  | "donation_receipt" | "volunteer_confirmation" | "event_invitation"
  | "graatek_notification" | "idea_update" | "password_reset"
  | "magazine_digest" | "maintenance" | "announcement"
  | "fundraising" | "reengagement";
export type AudienceSegment =
  | "all" | "arabic" | "french" | "english"
  | "donors" | "volunteers" | "graatek" | "ideas"
  | "inactive" | "new_users" | "premium";
export type CampaignLanguage = "all" | "ar" | "fr" | "en";
export type DeliveryHealthStatus = "healthy" | "warning" | "critical";

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  type: CampaignType;
  audience: AudienceSegment;
  language: CampaignLanguage;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  status: CampaignStatus;
  created_at: string;
  scheduled_at: string | null;
  recurrence: "none" | "weekly" | "monthly" | null;
}

export interface AudienceSegmentInfo {
  id: AudienceSegment;
  name: string;
  count: number;
  growth: string;
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  description: string;
  availableLanguages: CampaignLanguage[];
  thumbnail: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: "sent" | "scheduled" | "created" | "failed" | "draft" | "cancelled";
}

export interface AnalyticsDataPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface DeliveryHealthMetric {
  labelKey: string;
  label: string;
  status: DeliveryHealthStatus;
  valueKey: string;
  value: string;
  detailKey: string;
  detail: string;
}

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  bounceRate: number;
  engagementRate: number;
}

export const emailCampaignLog: EmailCampaign[] = [];

export const audienceSegments: AudienceSegmentInfo[] = [
  { id: "all", name: "All Users", count: 0, growth: "0%" },
  { id: "arabic", name: "Arabic Users", count: 0, growth: "0%" },
  { id: "french", name: "French Users", count: 0, growth: "0%" },
  { id: "english", name: "English Users", count: 0, growth: "0%" },
  { id: "donors", name: "Donors", count: 0, growth: "0%" },
  { id: "volunteers", name: "Volunteers", count: 0, growth: "0%" },
  { id: "graatek", name: "Graatek Users", count: 0, growth: "0%" },
  { id: "ideas", name: "Idea Participants", count: 0, growth: "0%" },
  { id: "inactive", name: "Inactive (90d)", count: 0, growth: "0%" },
  { id: "new_users", name: "New (30d)", count: 0, growth: "0%" },
  { id: "premium", name: "Premium Members", count: 0, growth: "0%" },
];

export const emailTemplates: EmailTemplateItem[] = [
  { id: "t1", name: "New Campaign Launch", description: "Bold announcement with hero image, CTA button, and social links", availableLanguages: ["ar", "fr", "en"], thumbnail: "campaign" },
  { id: "t2", name: "Volunteer Reminder", description: "Friendly reminder with event details and RSVP button", availableLanguages: ["ar", "fr", "en"], thumbnail: "volunteer" },
  { id: "t3", name: "Donation Verified", description: "Thank-you receipt with donation summary and impact story", availableLanguages: ["ar", "fr", "en"], thumbnail: "donation" },
  { id: "t4", name: "Newsletter Digest", description: "Multi-section layout with featured articles and quick links", availableLanguages: ["ar", "fr", "en"], thumbnail: "newsletter" },
  { id: "t5", name: "Event Invitation", description: "Event card with date, location, map link, and attendee count", availableLanguages: ["ar", "fr", "en"], thumbnail: "event" },
  { id: "t6", name: "Re-engagement", description: "We-miss-you message with personalised content suggestions", availableLanguages: ["ar", "fr", "en"], thumbnail: "reengage" },
];

export const campaignTypes: { value: CampaignType; label: string }[] = [
  { value: "welcome", label: "Welcome Email" },
  { value: "verification", label: "Verification" },
  { value: "newsletter", label: "Newsletter" },
  { value: "campaign_update", label: "Campaign Update" },
  { value: "donation_receipt", label: "Donation Receipt" },
  { value: "volunteer_confirmation", label: "Volunteer Confirmation" },
  { value: "event_invitation", label: "Event Invitation" },
  { value: "graatek_notification", label: "Graatek Notification" },
  { value: "idea_update", label: "Idea Update" },
  { value: "password_reset", label: "Password Reset" },
  { value: "magazine_digest", label: "Magazine Digest" },
  { value: "maintenance", label: "Maintenance Notice" },
  { value: "announcement", label: "Announcement" },
  { value: "fundraising", label: "Fundraising" },
  { value: "reengagement", label: "Re-engagement" },
];

export const activityLog: ActivityItem[] = [];

export function emptyCommunicationsAnalytics(): { trends: AnalyticsDataPoint[]; topCampaigns: { name: string; sent: number; openRate: number }[]; kpis: CampaignAnalytics } {
  return {
    trends: [],
    topCampaigns: [],
    kpis: {
      sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0,
      openRate: 0, clickRate: 0, deliveryRate: 0, bounceRate: 0, engagementRate: 0,
    },
  };
}

export const deliveryHealthMetrics: DeliveryHealthMetric[] = [];

export const audienceSegmentNames: Record<AudienceSegment, string> = {
  all: "All", arabic: "Arabic", french: "French", english: "English",
  donors: "Donors", volunteers: "Volunteers", graatek: "Graatek",
  ideas: "Ideas", inactive: "Inactive", new_users: "New Users", premium: "Premium",
};

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
