"use client";

import {useTranslations} from "next-intl";
import {useEffect} from "react";
import {toast} from "sonner";

import {useRouter} from "@/lib/i18n/routing";

export function MemorySubmittedToast({
  submitted,
  updated,
}: {
  submitted?: string;
  updated?: string;
}) {
  const t = useTranslations("Memory");
  const router = useRouter();

  useEffect(() => {
    if (submitted === "1") {
      toast.success(t("memoryShared") ?? "Memory shared successfully");
      router.replace("/memory");
    } else if (updated === "1") {
      toast.success(t("memoryUpdated") ?? "Memory updated");
      router.replace("/memory");
    }
  }, [submitted, updated, t, router]);

  return null;
}
