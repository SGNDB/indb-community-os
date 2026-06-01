import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {IdeaSubmitForm} from "@/components/ideas/idea-submit-form";

const categoryKeys = ["education", "environment", "youth", "culture"] as const;

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
  const t = await getTranslations({locale, namespace: "Categories"});

  const categories = categoryKeys.map((key, index) => ({
    id: index + 1,
    name: t(`idea.${key}`),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <IdeaSubmitForm categories={categories} />
    </div>
  );
}

