import type {SupportPaymentReceiver} from "@/modules/campaigns/types";

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
