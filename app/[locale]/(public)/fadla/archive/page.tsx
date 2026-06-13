import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Archive, Gift, LayoutGrid, ListFilter, User2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { getArchiveItems, type FadlaArchiveFilter } from '@/lib/data/fadla';
import { createClient } from '@/lib/supabase/server';

const FILTERS: FadlaArchiveFilter[] = ['all', 'mine', 'completed', 'archived'];

const FILTER_STYLE = {
  active: 'bg-[#ED2124] text-white border-[#ED2124] shadow-sm',
  inactive: 'border-border bg-card text-foreground hover:bg-muted',
} as const;

const STATUS_STYLE: Record<string, string> = {
  completed:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50',
  archived:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });

  return {
    title: t('fadlaArchive.title'),
    description: t('fadlaArchive.description'),
  };
}

export default async function FadlaArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const filter = FILTERS.includes(sp.filter as FadlaArchiveFilter)
    ? (sp.filter as FadlaArchiveFilter)
    : 'all';
  const t = await getTranslations({ locale, namespace: 'Fadla' });
  const common = await getTranslations({ locale, namespace: 'Common' });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await getArchiveItems({ page, filter, currentUserId: user?.id ?? null });

  function formatDate(dateStr: string): string {
    const localeMap: Record<string, string> = {
      ar: 'ar-SA',
      fr: 'fr-FR',
      ff: 'fr-FR',
      snk: 'fr-FR',
      wo: 'fr-FR',
    };
    return new Date(dateStr).toLocaleDateString(localeMap[locale] ?? 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-4xl border border-border/70 bg-card shadow-[0_18px_45px_rgba(8,33,56,0.08)]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_start,rgba(237,33,36,0.12),transparent_35%),radial-gradient(circle_at_bottom_end,rgba(34,197,94,0.14),transparent_35%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Archive size={16} />
              {t('archiveTitle')}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {t('archiveTitle')}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t('archiveDescription')}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={`/${locale}/fadla/archive?page=1&filter=${value}`}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === value ? FILTER_STYLE.active : FILTER_STYLE.inactive}`}
          >
            {value === 'all' ? (
              <LayoutGrid size={16} />
            ) : value === 'mine' ? (
              <User2 size={16} />
            ) : (
              <ListFilter size={16} />
            )}
            {t(`archiveFilters.${value}`)}
          </Link>
        ))}
      </div>

      {result.items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {result.items.map((item) => (
            <article
              key={item.id}
              className="space-y-4 rounded-[1.75rem] border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted text-muted-foreground">
                  {item.images.length > 0 ? (
                    <Image
                      src={item.images[0].url}
                      alt={item.title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center">
                      <Gift size={22} />
                      <span className="mt-1 block text-[11px] font-medium">
                        {t('imagePlaceholder')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 truncate text-lg font-bold leading-tight sm:text-xl">
                      {item.title}
                    </h2>
                    <Badge
                      className={`rounded-full border px-3 py-1 text-[14px] font-medium leading-none ${STATUS_STYLE[item.status]}`}
                    >
                      {t(`status.${item.status}`)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`categories.${item.category}`)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-foreground/85 sm:grid-cols-2">
                <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="font-semibold text-foreground">{t('ownerLabel')}</span>
                  <span className="truncate">
                    {item.owner?.full_name ?? item.owner?.username ?? t('unknownOwner')}
                  </span>
                </p>
                <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="font-semibold text-foreground">{t('recipientLabel')}</span>
                  <span className="truncate">
                    {item.accepted_request?.requester?.full_name ??
                      item.accepted_request?.requester?.username ??
                      '-'}
                  </span>
                </p>
                <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="font-semibold text-foreground">{t('completedOn')}</span>
                  <span>{item.completed_at ? formatDate(item.completed_at) : '-'}</span>
                </p>
                <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="font-semibold text-foreground">{t('archivedOn')}</span>
                  <span>{item.archived_at ? formatDate(item.archived_at) : '-'}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Archive size={30} />
          </div>
          <h2 className="mt-4 text-xl font-bold">{t('archiveEmpty.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t('archiveEmpty.description')}
          </p>
          <Link
            href={`/${locale}/fadla`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Gift size={17} />
            {t('backToActive')}
          </Link>
        </div>
      )}

      <PaginationControls
        page={result.page}
        hasNextPage={result.hasNextPage}
        previousLabel={common('previous')}
        nextLabel={common('next')}
      />
    </div>
  );
}
