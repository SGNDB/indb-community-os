import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {Archive, Gift} from "lucide-react";
import Link from "next/link";

import {FadlaCard} from "@/components/fadla/fadla-card";
import {PaginationControls} from "@/components/shared/pagination-controls";
import {getArchiveItems} from "@/lib/data/fadla";
import {createClient} from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("fadlaArchive.title"),
    description: t("fadlaArchive.description"),
  };
}

function formatDate(dateStr: string, locale: string): string {
  const localeMap: Record<string, string> = {
    ar: "ar-SA", fr: "fr-FR", ff: "fr-FR", snk: "fr-FR", wo: "fr-FR",
  };
  return new Date(dateStr).toLocaleDateString(localeMap[locale] ?? "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default async function FadlaArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string; item?: string}>;
}) {
  const {locale} = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const t = await getTranslations({locale, namespace: "Fadla"});
  const common = await getTranslations({locale, namespace: "Common"});
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const result = await getArchiveItems({page});

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_18px_45px_rgba(8,33,56,0.08)]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_start,rgba(237,33,36,0.12),transparent_35%),radial-gradient(circle_at_bottom_end,rgba(34,197,94,0.14),transparent_35%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Archive size={16} />
              {t("archiveTitle")}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("archiveTitle")}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("archiveDescription")}</p>
          </div>
        </div>
      </section>

      {result.items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {result.items.map((item) => (
            <div key={item.id} className="space-y-2">
              <FadlaCard
                item={item}
                currentUserId={user?.id ?? null}
                locale={locale}
              />
              <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <Archive size={12} />
                {item.status === "completed" && item.completed_at ? (
                  <span>{t("completedOn")} {formatDate(item.completed_at, locale)}</span>
                ) : item.status === "archived" && item.archived_at ? (
                  <span>{t("archivedOn")} {formatDate(item.archived_at, locale)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Archive size={30} />
          </div>
          <h2 className="mt-4 text-xl font-bold">{t("archiveEmpty.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("archiveEmpty.description")}</p>
          <Link
            href={`/${locale}/fadla`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Gift size={17} />
            {t("backToActive")}
          </Link>
        </div>
      )}

      <PaginationControls
        page={result.page}
        hasNextPage={result.hasNextPage}
        previousLabel={common("previous")}
        nextLabel={common("next")}
      />
    </div>
  );
}
