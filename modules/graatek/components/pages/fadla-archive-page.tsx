import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import {assertFeatureEnabled} from "@/core/features/server";

async function assertGraatekPageEnabled() {
  try {
    await assertFeatureEnabled("graatek");
  } catch {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });

  return {
    title: t('fadla.title'),
    description: t('fadla.description'),
  };
}

export default async function FadlaArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await assertGraatekPageEnabled();
  const { locale } = await params;
  // Redirect to main Fadla page with completed filter
  redirect(`/${locale}/fadla?status=completed`);
}
