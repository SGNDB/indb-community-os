import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {AboutPlatformClient} from "@/components/about/about-platform-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "AboutPlatform"});

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AboutPlatformPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  return <AboutPlatformClient locale={locale} />;
}
