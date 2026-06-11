"use client";

import {Gift, HandHeart, Loader2, Plus, Search, Sparkles, X} from "lucide-react";
import {useTranslations} from "next-intl";
import type {FormEvent} from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {toast} from "sonner";

import {submitCommunityShareAction, updateCommunityShareAction} from "@/app/[locale]/server-actions";
import {FadlaCard} from "@/components/fadla/fadla-card";
import {MediaUpload, type ExistingMediaItem, type MediaItem} from "@/components/shared/media-upload";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "@/lib/i18n/routing";
import type {CommunityShareCategory, CommunityShareWithOwner} from "@/types/database";

const categories: CommunityShareCategory[] = [
  "food",
  "clothes",
  "furniture",
  "electronics",
  "school_supplies",
  "books",
  "services",
  "other",
];

function ShareForm({
  locale,
  initialShare,
  onDone,
}: {
  locale: string;
  initialShare?: CommunityShareWithOwner | null;
  onDone: () => void;
}) {
  const t = useTranslations("Fadla");
  const imageUploadT = useTranslations("ImageUpload");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [removedMediaPaths, setRemovedMediaPaths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const mediaUploading = mediaItems.some((item) => item.uploading);
  const isEditing = !!initialShare;

  const existingMedia: ExistingMediaItem[] | undefined = initialShare?.images.map((image) => ({
    storagePath: image.storagePath,
    url: image.url,
    type: "image",
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (mediaUploading) {
      toast.error(imageUploadT("uploading"));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const uploaded = mediaItems.filter((item) => !item.failed && item.url && item.type === "image");
    if (uploaded.length > 0) {
      formData.set("mediaData", JSON.stringify(
        uploaded.map((item) => ({
          url: item.url,
          storagePath: item.storagePath,
          type: "image",
          mimeType: item.mimeType ?? "",
        })),
      ));
    }
    if (removedMediaPaths.length > 0) {
      formData.set("removedMedia", JSON.stringify(removedMediaPaths));
    }
    formData.set("locale", locale);
    if (initialShare) formData.set("shareId", initialShare.id);

    setSubmitting(true);
    try {
      const result = initialShare
        ? await updateCommunityShareAction(formData)
        : await submitCommunityShareAction(formData);

      if (!result.success) {
        toast.error(result.error || t("errors.saveFailed"));
        return;
      }

      toast.success(initialShare ? t("toasts.updated") : t("toasts.created"));
      onDone();
      router.refresh();
      router.push(initialShare ? "/fadla?shareUpdated=1" : "/fadla?shareCreated=1");
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {initialShare ? <input type="hidden" name="shareId" value={initialShare.id} /> : null}

      <Input name="title" placeholder={t("form.title")} defaultValue={initialShare?.title ?? ""} required />
      <Textarea name="description" placeholder={t("form.description")} defaultValue={initialShare?.description ?? ""} required />

      <select
        name="category"
        defaultValue={initialShare?.category ?? "other"}
        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm max-sm:text-base"
        required
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {t(`categories.${category}`)}
          </option>
        ))}
      </select>

      <Input name="condition" placeholder={t("form.condition")} defaultValue={initialShare?.condition ?? ""} />
      <Input name="location" placeholder={t("form.location")} defaultValue={initialShare?.location ?? ""} />

      <MediaUpload
        existingMedia={existingMedia}
        onMediaChange={(items, removed) => {
          setMediaItems(items);
          setRemovedMediaPaths(removed);
        }}
        uploadKind="fadla"
        allowVideo={false}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting || mediaUploading}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={submitting || mediaUploading}>
          {submitting || mediaUploading ? <Loader2 size={18} className="animate-spin" /> : null}
          {mediaUploading ? imageUploadT("uploading") : isEditing ? t("form.update") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}

export function FadlaClient({
  shares,
  currentUserId,
  locale,
  toastState,
}: {
  shares: CommunityShareWithOwner[];
  currentUserId?: string | null;
  locale: string;
  toastState?: {
    created?: boolean;
    updated?: boolean;
    deleted?: boolean;
    requested?: boolean;
    error?: boolean;
  };
}) {
  const t = useTranslations("Fadla");
  const [open, setOpen] = useState(false);
  const [editingShare, setEditingShare] = useState<CommunityShareWithOwner | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommunityShareCategory | "all">("all");

  useEffect(() => {
    if (toastState?.created) toast.success(t("toasts.created"));
    if (toastState?.updated) toast.success(t("toasts.updated"));
    if (toastState?.deleted) toast.success(t("toasts.deleted"));
    if (toastState?.requested) toast.success(t("toasts.requested"));
    if (toastState?.error) toast.error(t("errors.actionFailed"));
  }, [t, toastState]);

  const filteredShares = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return shares.filter((share) => {
      const matchesCategory = category === "all" || share.category === category;
      if (!matchesCategory) return false;
      if (!normalized) return true;
      return [share.title, share.description, share.location, t(`categories.${share.category}`)]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [category, query, shares, t]);

  function openCreate() {
    setEditingShare(null);
    setOpen(true);
  }

  function openEdit(share: CommunityShareWithOwner) {
    setEditingShare(share);
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingShare(null);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_18px_45px_rgba(8,33,56,0.08)]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_start,rgba(237,33,36,0.12),transparent_35%),radial-gradient(circle_at_bottom_end,rgba(34,197,94,0.14),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Sparkles size={16} />
                {t("eyebrow")}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">{t("description")}</p>
              <p className="mt-3 text-sm font-semibold text-foreground">{t("notMarketplace")}</p>
            </div>
            <Button onClick={openCreate} className="min-h-12 rounded-full px-5 text-base font-bold">
              <Plus size={19} />
              {t("shareButton")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card p-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={18} className="absolute inset-y-0 start-3 my-auto text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 rounded-full ps-10"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CommunityShareCategory | "all")}
          className="h-12 rounded-full border border-border bg-card px-4 text-sm"
        >
          <option value="all">{t("allCategories")}</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {t(`categories.${item}`)}
            </option>
          ))}
        </select>
      </section>

      {filteredShares.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredShares.map((share) => (
            <FadlaCard
              key={share.id}
              share={share}
              currentUserId={currentUserId}
              locale={locale}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandHeart size={30} />
          </div>
          <h2 className="mt-4 text-xl font-bold">{t("empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("empty.description")}</p>
          <Button onClick={openCreate} className="mt-5 rounded-full">
            <Gift size={17} />
            {t("shareButton")}
          </Button>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center" onClick={closeForm}>
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-card p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{editingShare ? t("form.editTitle") : t("form.createTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("form.helper")}</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <ShareForm locale={locale} initialShare={editingShare} onDone={closeForm} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
