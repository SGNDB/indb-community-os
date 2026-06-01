"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {ideaSchema} from "@/lib/validations/community";

type IdeaFormInput = z.input<typeof ideaSchema>;
type IdeaFormOutput = z.output<typeof ideaSchema>;

export function IdeaSubmitForm({
  categories,
}: {
  categories: Array<{id: number; name: string}>;
}) {
  const t = useTranslations("IdeaForm");
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<IdeaFormInput, unknown, IdeaFormOutput>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(() => setSubmitted(true))} className="space-y-3">
          {submitted ? <p className="rounded-xl bg-primary/10 p-2 text-xs text-primary">{t("ready")}</p> : null}
          <Input {...register("title")} name="title" placeholder={t("fields.title")} />
          {errors.title ? <p className="text-xs text-destructive">{t("errors.title")}</p> : null}
          <Textarea
            {...register("description")}
            name="description"
            placeholder={t("fields.description")}
          />
          {errors.description ? <p className="text-xs text-destructive">{t("errors.description")}</p> : null}
          <select
            {...register("categoryId")}
            name="categoryId"
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option disabled value="">
              {t("fields.category")}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <p className="text-xs text-destructive">{t("errors.category")}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

