import {Scale} from "lucide-react";
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
    title: t("terms.title"),
    description: t("terms.description"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Terms"});

  const sections = [
    {titleKey: "introTitle", bodyKey: "introBody"},
    {titleKey: "rulesTitle", bodyKey: "rulesBody", listKey: "rulesList"},
    {titleKey: "responsibilitiesTitle", bodyKey: "responsibilitiesBody", listKey: "responsibilitiesList"},
    {titleKey: "prohibitedTitle", bodyKey: "prohibitedBody", listKey: "prohibitedList"},
    {titleKey: "moderationTitle", bodyKey: "moderationBody"},
    {titleKey: "suspensionTitle", bodyKey: "suspensionBody"},
    {titleKey: "limitationsTitle", bodyKey: "limitationsBody"},
    {titleKey: "contactTitle", bodyKey: "contactBody"},
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Scale className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("lastUpdated")}</p>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map(({titleKey, bodyKey, listKey}, i) => {
          const items = listKey ? (t.raw(listKey) as string[]) : null;
          return (
            <section key={i} className="space-y-3">
              <h2 className="text-xl font-semibold">{t(titleKey)}</h2>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {t(bodyKey)
                  .split("\n")
                  .map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
              </div>
              {items && items.length > 0 && (
                <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                  {items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
