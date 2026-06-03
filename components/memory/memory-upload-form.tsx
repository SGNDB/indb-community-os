"use client";

import {useTranslations} from "next-intl";
import {ImagePlus, X} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {submitMemoryAction} from "@/app/[locale]/server-actions";
import {prepareImageForUpload, ImageUploadError} from "@/lib/images/client-compression";
import {ACCEPTED_IMAGE_EXTENSIONS} from "@/lib/images/upload-config";

export function MemoryUploadForm({
  locale,
}: {
  locale: string;
}) {
  const t = useTranslations("MemoryForm");
  const imageT = useTranslations("ImageUpload");
  const formRef = useRef<HTMLFormElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function handleFormData(e: Event) {
      const event = e as unknown as {formData: FormData};
      if (mediaFile) {
        event.formData.set("media", mediaFile);
      }
    }

    form.addEventListener("formdata" as keyof HTMLElementEventMap, handleFormData as EventListener);
    return () => form.removeEventListener("formdata" as keyof HTMLElementEventMap, handleFormData as EventListener);
  }, [mediaFile]);

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
      const preparedFile = await prepareImageForUpload(file, "memory");
      setMediaFile(preparedFile);
      setImagePreview(URL.createObjectURL(preparedFile));
    } catch (error) {
      toast.error(getUploadErrorMessage(error));
      e.target.value = "";
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={submitMemoryAction} className="space-y-3" encType="multipart/form-data">
          <input type="hidden" name="locale" value={locale} />
          <Input name="title" placeholder={t("fields.title")} required />
          <Textarea name="description" placeholder={t("fields.story")} required />
          <Input name="decade" placeholder={t("fields.eraLabel")} />
          <Input name="year" type="number" placeholder="Year (e.g. 1984)" />
          <Input name="location" placeholder={t("fields.location")} />
          <Input name="tags" placeholder="Tags (comma separated)" />
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground">
            <ImagePlus size={16} />
            {imageUploading ? imageT("uploading") : imageT("chooseImage")}
            <input
              name="media"
              type="file"
              accept={ACCEPTED_IMAGE_EXTENSIONS}
              className="hidden"
              onChange={(e) => void handleImageChange(e)}
            />
          </label>
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img src={imagePreview} alt="" className="max-h-56 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setMediaFile(null);
                  const input = document.querySelector<HTMLInputElement>('input[name="media"]');
                  if (input) input.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
          <Button type="submit" className="min-h-11 w-full" disabled={imageUploading}>
            {imageUploading ? imageT("uploading") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
