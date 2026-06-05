import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {MemoryCard} from "@/components/memory/memory-card";
import {MemoryDetailsClient} from "@/components/memory/memory-details-client";
import {getApprovedMemories, getMemoryById} from "@/lib/data/memories";
import {getCurrentProfile} from "@/lib/data/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});
  const memory = await getMemoryById(slug);

  return {
    title: memory ? `${memory.title} | ${t("memory.title")}` : t("memory.title"),
    description: t("memory.description"),
  };
}

export default async function MemoryDetailsPage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "Memory"});
  const memory = await getMemoryById(slug);
  const profile = await getCurrentProfile();

  if (!memory) {
    notFound();
  }

  const isContributor = profile?.id === memory.contributor_id;
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";
  const canView = memory.verification_status === "approved" || isContributor || isAdmin;

  if (!canView) {
    notFound();
  }

  const allMemories = await getApprovedMemories();
  const related = allMemories.filter((item) => item.id !== memory.id).slice(0, 2);

  return (
    <div className="space-y-5">
      <MemoryDetailsClient memory={memory} locale={locale} />

      {related.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">{t("relatedMemories")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {related.map((item) => (
              <MemoryCard key={item.id} memory={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}


