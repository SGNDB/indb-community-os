import {Clock3} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {memories} from "@/lib/constants/mock-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Meta"});

  return {
    title: t("timeline.title"),
    description: t("timeline.description"),
  };
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Timeline"});
  const ordered = [...memories].sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Clock3 size={18} />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {ordered.map((memory) => (
            <li key={memory.slug} className="rounded-xl bg-muted/50 p-3">
              <p className="text-sm font-semibold">{memory.year}</p>
              <p className="text-sm">{memory.title}</p>
              <p className="text-xs text-muted-foreground">{memory.location}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

