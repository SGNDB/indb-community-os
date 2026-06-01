import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {IdeaSubmitForm} from "@/components/ideas/idea-submit-form";
import {getCategories} from "@/lib/data/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("ideaSubmit.title"),
    description: t("ideaSubmit.description"),
  };
}

export default async function SubmitIdeaPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  const dbCategories = await getCategories();
  const categories = dbCategories.map((cat) => ({
    id: cat.id,
    name: locale === "ar" ? cat.name_ar : locale === "fr" ? cat.name_fr : cat.name_en,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <IdeaSubmitForm categories={categories} locale={locale} />
    </div>
  );
}
