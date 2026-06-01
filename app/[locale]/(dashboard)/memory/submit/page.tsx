import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {MemoryUploadForm} from "@/components/memory/memory-upload-form";

const categoryKeys = ["history", "railway", "fishing", "culture"] as const;

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
  const t = await getTranslations({locale, namespace: "Categories"});

  const categories = categoryKeys.map((key, index) => ({
    id: index + 1,
    name: t(`memory.${key}`),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <MemoryUploadForm categories={categories} />
    </div>
  );
}

