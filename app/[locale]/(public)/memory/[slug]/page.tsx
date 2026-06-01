import {MapPin, UserRound} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {MemoryCard} from "@/components/memory/memory-card";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {memories} from "@/lib/constants/mock-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});
  const memory = memories.find((item) => item.slug === slug);

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
  const memory = memories.find((item) => item.slug === slug);

  if (!memory) {
    notFound();
  }

  const related = memories.filter((item) => item.slug !== memory.slug).slice(0, 2);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <img src={memory.image} alt={memory.title} className="h-72 w-full object-cover" />
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{memory.year}</p>
          <CardTitle className="text-2xl">{memory.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{memory.story}</p>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={13} />
            {memory.location}
          </p>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <UserRound size={13} />
            {t("contributedBy", {name: memory.contributor})}
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">{t("relatedMemories")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {related.map((item) => (
            <MemoryCard key={item.slug} memory={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

