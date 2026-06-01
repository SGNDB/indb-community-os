"use client";

import {useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {submitMemoryAction} from "@/app/[locale]/server-actions";

function SubmitButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" className="min-h-11 w-full" disabled={pending}>
      {pending ? loading : label}
    </Button>
  );
}

export function MemoryUploadForm({
  locale,
}: {
  locale: string;
}) {
  const t = useTranslations("MemoryForm");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submitMemoryAction} className="space-y-3" encType="multipart/form-data">
          <input type="hidden" name="locale" value={locale} />
          <Input name="title" placeholder={t("fields.title")} required />
          <Textarea name="description" placeholder={t("fields.story")} required />
          <Input name="decade" placeholder={t("fields.eraLabel")} />
          <Input name="year" type="number" placeholder="Year (e.g. 1984)" />
          <Input name="location" placeholder={t("fields.location")} />
          <Input name="tags" placeholder="Tags (comma separated)" />
          <Input name="media" type="file" accept="image/*" />
          <SubmitButton label={t("submit")} loading={t("submitting")} />
        </form>
      </CardContent>
    </Card>
  );
}
