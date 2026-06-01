import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {AdminStatsCard} from "@/components/admin/admin-stats-card";
import {ModerationQueue} from "@/components/admin/moderation-queue";

const queue = [
  {
    id: "m-1",
    target_type: "memory",
    reasonKey: "yearConfirmation",
    status: "pending",
    created_at: "2026-06-01",
  },
  {
    id: "m-2",
    target_type: "post",
    reasonKey: "respectfulTone",
    status: "pending",
    created_at: "2026-06-01",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("admin.title"),
    description: t("admin.description"),
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard label={t("stats.postsToday")} value={38} />
        <AdminStatsCard label={t("stats.pendingMemories")} value={9} />
        <AdminStatsCard label={t("stats.openIdeas")} value={17} />
        <AdminStatsCard label={t("stats.reportsQueue")} value={2} />
      </div>
      <ModerationQueue
        items={queue.map((item) => ({
          ...item,
          reason: t(`reasons.${item.reasonKey}`),
        }))}
      />
    </div>
  );
}

