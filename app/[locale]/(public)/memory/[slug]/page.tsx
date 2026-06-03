import {CalendarDays, MapPin, Tag, UserRound} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {MemoryCard} from "@/components/memory/memory-card";
import {MemoryVerificationBadge} from "@/components/memory/memory-verification-badge";
import {ShareButton} from "@/components/shared/share-button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
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
  const contributorName = memory.contributor?.full_name ?? memory.contributor?.username ?? t("unknownContributor");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/70 shadow-[0_16px_38px_rgba(8,33,56,0.12)]">
        {memory.media_url ? (
          <div className="relative h-72 w-full sm:h-80 md:h-96">
            <img src={memory.media_url} alt={memory.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-muted sm:h-80">
            <span className="text-muted-foreground">{t("noImage")}</span>
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand-primary-soft text-brand-primary">
              {memory.decade ?? memory.year ?? "?"}
            </Badge>
            <MemoryVerificationBadge status={memory.verification_status} />
            {memory.location ? (
              <Badge className="rounded-lg border-primary/15 bg-primary/8 text-primary">
                <MapPin size={12} className="me-1" />
                {memory.location}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-2xl leading-tight sm:text-3xl">{memory.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-7 text-foreground/90">{memory.description ?? memory.title}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={14} />
              {t("contributedBy", {name: contributorName})}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {new Date(memory.created_at).toLocaleDateString(locale)}
            </span>
          </div>

          {memory.tags && memory.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <Badge key={tag} className="gap-1 rounded-full border-border/60 px-3 py-1 text-xs">
                  <Tag size={11} />
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-2">
            <ShareButton />
          </div>
        </CardContent>
      </Card>

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


