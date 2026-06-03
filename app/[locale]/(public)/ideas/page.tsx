import {ChevronUp, Lightbulb, Plus, Trophy} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {IdeaCard} from "@/components/ideas/idea-card";
import {EmptyState} from "@/components/shared/empty-state";
import {Link} from "@/lib/i18n/routing";
import {getIdeas} from "@/lib/data/ideas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("ideas.title"),
    description: t("ideas.description"),
  };
}

export default async function IdeasPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Ideas"});
  const empty = await getTranslations({locale, namespace: "EmptyStates.ideas"});
  const {ideas, totalUsers} = await getIdeas();

  const topIdeas = ideas.filter((i) => i.rank !== null).slice(0, 3);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Link
            href="/ideas/submit"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus size={16} />
            {t("shareAnother")}
          </Link>
        </div>
      </div>

      {topIdeas.length > 0 ? (
        <section className="rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold">{t("topPriorities")}</h2>
          </div>
          <div className="space-y-2.5">
            {topIdeas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas?id=${idea.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/50 px-3.5 py-2.5 transition hover:bg-muted/50 sm:px-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F4C75] to-[#27C5D8] text-[11px] font-bold text-white">
                    {idea.rank}
                  </span>
                  <span className="truncate text-sm font-medium">{idea.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <ChevronUp size={12} />
                    {idea.votes_count}
                  </span>
                  <span className="tabular-nums">{t("supportPercent", {percent: idea.supportPercentage})}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {ideas.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} totalUsers={totalUsers} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title={empty("title")}
          description={empty("description")}
          ctaLabel={empty("cta")}
          ctaHref="/ideas/submit"
        />
      )}
    </div>
  );
}
