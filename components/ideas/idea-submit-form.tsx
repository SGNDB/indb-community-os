"use client";

import {ImagePlus, X} from "lucide-react";
import {useState} from "react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {submitIdeaAction} from "@/app/[locale]/server-actions";
import {prepareImageForUpload, ImageUploadError} from "@/lib/images/client-compression";
import {ACCEPTED_IMAGE_EXTENSIONS} from "@/lib/images/upload-config";

function SubmitButton({label, loading, pending}: {label: string; loading: string; pending: boolean}) {
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
  const imageT = useTranslations("ImageUpload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getUploadErrorMessage(error: unknown) {
    if (error instanceof ImageUploadError) {
      return imageT(error.code);
    }

    return imageT("failed");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const preparedFile = await prepareImageForUpload(file, "post");
      setImageFile(preparedFile);
      setImagePreview(URL.createObjectURL(preparedFile));
    } catch (error) {
      toast.error(getUploadErrorMessage(error));
      e.target.value = "";
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    if (imageFile) {
      formData.set("imageFile", imageFile);
    }

    try {
      await submitIdeaAction(formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3" encType="multipart/form-data">
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
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground">
            <ImagePlus size={16} />
            {imageUploading ? imageT("uploading") : imageT("chooseImage")}
            <input
              name="imageFile"
              type="file"
              accept={ACCEPTED_IMAGE_EXTENSIONS}
              className="hidden"
              onChange={(e) => void handleImageChange(e)}
            />
          </label>
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img src={imagePreview} alt="" className="max-h-48 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  const input = document.querySelector<HTMLInputElement>('input[name="imageFile"]');
                  if (input) input.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
          <SubmitButton label={t("submit")} loading={imageUploading ? imageT("uploading") : t("submitting")} pending={submitting || imageUploading} />
        </form>
      </CardContent>
    </Card>
  );
}
