import {getTranslations} from "next-intl/server";

import {createPostAction} from "@/app/[locale]/server-actions";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

export async function CreatePostBox({
  locale,
  categories,
}: {
  locale: string;
  categories: Array<{id: number; name: string}>;
}) {
  const t = await getTranslations({locale, namespace: "FeedComposer"});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("composerTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createPostAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <Input name="title" placeholder={t("form.title")} required />
          <Textarea name="content" placeholder={t("form.content")} required />
          <Input name="mediaUrl" placeholder={t("form.mediaUrl")} />
          <select
            name="categoryId"
            required
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option disabled value="">
              {t("form.selectCategory")}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit">{t("form.publish")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

