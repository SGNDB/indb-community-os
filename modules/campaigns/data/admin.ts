import {getSupportCampaigns} from "@/modules/campaigns/data/campaigns";
import {createAdminClient} from "@/lib/supabase/admin";
import type {SupportContribution} from "@/modules/campaigns/types";

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
