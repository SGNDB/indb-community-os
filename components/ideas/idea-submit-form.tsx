"use client";

import {useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {submitIdeaAction} from "@/app/[locale]/server-actions";

function SubmitButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" className="min-h-11 w-full" disabled={pending}>
      {pending ? loading : label}
    </Button>
  );
}

export function IdeaSubmitForm({
  categories,
  locale,
}: {
  categories: Array<{id: number; name: string}>;
  locale: string;
}) {
  const t = useTranslations("IdeaForm");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submitIdeaAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <Input name="title" placeholder={t("fields.title")} required />
          <Textarea name="description" placeholder={t("fields.description")} required />
          <select
            name="categoryId"
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="">{t("fields.category")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <SubmitButton label={t("submit")} loading={t("submitting")} />
        </form>
      </CardContent>
    </Card>
  );
}
