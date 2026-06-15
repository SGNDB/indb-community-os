import {Trash2} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});
  return {
    title: t("dataDeletion.title"),
    description: t("dataDeletion.description"),
  };
}

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "DataDeletion"});

  const sections = [
    {titleKey: "introTitle", bodyKey: "introBody"},
    {titleKey: "accountTitle", bodyKey: "accountBody"},
    {titleKey: "postsTitle", bodyKey: "postsBody"},
    {titleKey: "memoriesTitle", bodyKey: "memoriesBody"},
    {titleKey: "ideasTitle", bodyKey: "ideasBody"},
    {titleKey: "fadlaTitle", bodyKey: "fadlaBody"},
    {titleKey: "contactTitle", bodyKey: "contactBody"},
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="size-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <p className="font-medium">{t("noticeTitle")}</p>
        <p className="mt-1 text-destructive/80">{t("noticeBody")}</p>
      </div>

      <div className="space-y-8">
        {sections.map(({titleKey, bodyKey}, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-xl font-semibold">{t(titleKey)}</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {t(bodyKey)
                .split("\n")
                .map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
