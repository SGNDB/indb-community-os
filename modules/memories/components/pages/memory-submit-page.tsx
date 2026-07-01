import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {assertFeatureEnabled} from "@/core/features/server";
import {MemoryErrorToast} from "@/modules/memories/components/memory-error-toast";
import {MemoryUploadForm} from "@/modules/memories/components/memory-upload-form";
import {getMemoryById} from "@/modules/memories/data";

async function assertMemoriesPageEnabled() {
  try {
    await assertFeatureEnabled("memories");
  } catch {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("memorySubmit.title"),
    description: t("memorySubmit.description"),
  };
}

export default async function SubmitMemoryPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{id?: string; error?: string}>;
}) {
  await assertMemoriesPageEnabled();
  const {locale} = await params;
  const {id, error} = await searchParams;

  let existingMemory = null;
  if (id) {
    existingMemory = await getMemoryById(id);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-0">
      <MemoryErrorToast error={error} />
      <MemoryUploadForm locale={locale} existingMemory={existingMemory} />
    </div>
  );
}
