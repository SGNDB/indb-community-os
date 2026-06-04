import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {MemoryUploadForm} from "@/components/memory/memory-upload-form";

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
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-0">
      <MemoryUploadForm locale={locale} />
    </div>
  );
}
