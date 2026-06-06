"use client";

import {ShieldCheck, Clock, XCircle, HelpCircle} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import type {MemoryVerificationStatus} from "@/types/database";

const icons: Record<MemoryVerificationStatus, typeof ShieldCheck> = {
  pending: Clock,
  approved: ShieldCheck,
  rejected: XCircle,
  needs_more_info: HelpCircle,
};

const palette: Record<MemoryVerificationStatus, string> = {
  pending: "border-amber-300/40 bg-amber-50/70 text-amber-700 dark:border-amber-700/30 dark:bg-amber-950/20 dark:text-amber-400",
  approved: "border-emerald-300/40 bg-emerald-50/70 text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-950/20 dark:text-emerald-400",
  rejected: "border-destructive/20 bg-destructive/10 text-destructive",
  needs_more_info: "border-gray-300/40 bg-gray-50/70 text-gray-700 dark:border-gray-700/30 dark:bg-gray-800/20 dark:text-gray-400",
};

const keys: Record<MemoryVerificationStatus, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  needs_more_info: "needsMoreInfo",
};

export function MemoryVerificationBadge({status}: {status: MemoryVerificationStatus}) {
  const t = useTranslations("Memory.verification");
  const Icon = icons[status] ?? ShieldCheck;
  const key = keys[status] ?? "approved";

  return (
    <Badge className={`gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ${palette[status] ?? palette.approved}`}>
      <Icon size={12} />
      {t(key)}
    </Badge>
  );
}
