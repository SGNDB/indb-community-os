import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {MemoryCard} from "@/components/memory/memory-card";
import {MemoryDetailsClient} from "@/components/memory/memory-details-client";
import {getApprovedMemories, getMemoryById} from "@/lib/data/memories";

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
  searchParams,
}: {
  params: Promise<{locale: string; slug: string}>;
  searchParams: Promise<{comment?: string; notification?: string}>;
}) {
  const {locale, slug} = await params;
  const sp = await searchParams;
  const t = await getTranslations({locale, namespace: "Memory"});
  const memory = await getMemoryById(slug);

  if (!memory) {
    notFound();
  }

  const allMemories = await getApprovedMemories();
  const related = allMemories.filter((item) => item.id !== memory.id).slice(0, 2);

  return (
    <div className="space-y-5">
      <MemoryDetailsClient memory={memory} locale={locale} defaultCommentsOpen={!!sp.comment || !!sp.notification} />

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

