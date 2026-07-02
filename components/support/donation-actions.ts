"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {assertFeatureEnabledForMutation} from "@/core/features/server";
import {withLocale} from "@/lib/i18n/paths";

export async function submitDonation(prev: unknown, formData: FormData) {
  try {
    await assertFeatureEnabledForMutation("campaigns");
  } catch {
    return {error: "module_disabled"};
  }
  const campaignId = formData.get("campaignId") as string;
  const campaignSlug = formData.get("campaignSlug") as string;
  const locale = formData.get("locale") as string;
  const amount = Number(formData.get("amount"));
  const paymentMethod = formData.get("paymentMethod") as "bankily" | "masrivi" | "sedad";

  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "unauthorized"};

  if (!amount || amount <= 0) return {error: "invalid-amount"};
  if (!paymentMethod) return {error: "invalid-payment"};

  const {recordSupportContribution} = await import("@/lib/data/support");

  try {
    await recordSupportContribution({
      campaignId,
      userId: user.id,
      contributionType: "money",
      amount,
      paymentMethod,
      transactionId: `INDB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      receiptUrl: null,
      receiptStoragePath: null,
    });
  } catch {
    return {error: "server-error"};
  }

  revalidatePath(withLocale("/campaigns", locale));
  revalidatePath(withLocale(`/campaigns/${campaignSlug}`, locale));
  return {success: true};
}
