"use client";

import {Gift, HandHeart, Loader2, Plus, Search, Sparkles, X} from "lucide-react";
import {useTranslations} from "next-intl";
import type {FormEvent} from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {toast} from "sonner";

import {submitFadlaItemAction, updateFadlaItemAction} from "@/app/[locale]/server-actions";
import {FadlaCard} from "@/components/fadla/fadla-card";
import {MediaUpload, type ExistingMediaItem, type MediaItem} from "@/components/shared/media-upload";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/client";
import type {FadlaCategory, FadlaWithOwner} from "@/types/database";

const FADLA_CATEGORIES: FadlaCategory[] = [
  "food", "clothes", "books", "school_supplies", "furniture",
  "tools", "electronics", "medical", "household", "other",
];

const URGENCY_OPTIONS = ["urgent", "this_week", "no_urgency"] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍲", clothes: "👕", books: "📚", school_supplies: "🎒", furniture: "🪑",
  tools: "🧰", electronics: "💻", medical: "🩺", household: "🏠", other: "📦",
};

function ItemForm({
  locale,
  initialItem,
  onDone,
}: {
  locale: string;
  initialItem?: FadlaWithOwner | null;
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
  const isEditing = !!initialItem;

  const existingMedia: ExistingMediaItem[] | undefined = initialItem?.images.map((image) => ({
    storagePath: image.storagePath,
    url: image.url,
    type: "image",
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (mediaUploading) { toast.error(imageUploadT("uploading")); return; }

    const formData = new FormData(event.currentTarget);
    const uploaded = mediaItems.filter((item) => !item.failed && item.url && item.type === "image");
    if (uploaded.length > 0) {
      formData.set("mediaData", JSON.stringify(
        uploaded.map((item) => ({url: item.url, storagePath: item.storagePath, type: "image", mimeType: item.mimeType ?? ""})),
      ));
    }
    if (removedMediaPaths.length > 0) formData.set("removedMedia", JSON.stringify(removedMediaPaths));
    formData.set("locale", locale);
    if (initialItem) formData.set("shareId", initialItem.id);

    setSubmitting(true);
    try {
      const result = initialItem
        ? await updateFadlaItemAction(formData)
        : await submitFadlaItemAction(formData);

      if (!result.success) { toast.error(result.error || t("errors.saveFailed")); return; }
      toast.success(initialItem ? t("toasts.updated") : t("toasts.created"));
      onDone();
      router.push(initialItem ? "/fadla?shareUpdated=1" : "/fadla?shareCreated=1");
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {initialItem ? <input type="hidden" name="shareId" value={initialItem.id} /> : null}

      <Input name="title" placeholder={t("form.title")} defaultValue={initialItem?.title ?? ""} required />
      <Textarea name="description" placeholder={t("form.description")} defaultValue={initialItem?.description ?? ""} required />

      <select
        name="category"
        defaultValue={initialItem?.category ?? "other"}
        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm max-sm:text-base"
        required
      >
        {FADLA_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_EMOJI[cat]} {t(`categories.${cat}`)}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <Input name="quantity" type="number" min={1} max={9999} placeholder={t("form.quantity")} defaultValue={initialItem?.quantity?.toString() ?? "1"} />
        <select
          name="urgency_level"
          defaultValue={initialItem?.urgency_level ?? "no_urgency"}
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm max-sm:text-base"
        >
          {URGENCY_OPTIONS.map((u) => (
            <option key={u} value={u}>{t(`urgency.${u}`)}</option>
          ))}
        </select>
      </div>

      <Input name="condition" placeholder={t("form.condition")} defaultValue={initialItem?.condition ?? ""} />
      <Input name="location" placeholder={t("form.location")} defaultValue={initialItem?.location ?? ""} />

      <MediaUpload
        existingMedia={existingMedia}
        onMediaChange={(items, removed) => { setMediaItems(items); setRemovedMediaPaths(removed); }}
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
  items,
  currentUserId,
  locale,
}: {
  items: FadlaWithOwner[];
  currentUserId?: string | null;
  locale: string;
}) {
  const t = useTranslations("Fadla");
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FadlaWithOwner | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FadlaCategory | "all">("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [liveItems, setLiveItems] = useState<FadlaWithOwner[]>(items);

  useEffect(() => {
    setLiveItems(items);
  }, [items]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("fadla-list-realtime");

    async function fetchAndUpsertItem(itemId: string) {
      const {data} = await supabase
        .from("community_shares")
        .select("*, owner:profiles!community_shares_owner_id_fkey(id, username, full_name, avatar_url)")
        .eq("id", itemId)
        .maybeSingle();

      if (!data) {
        setLiveItems((prev) => prev.filter((item) => item.id !== itemId));
        return;
      }

      const nextItem = data as unknown as FadlaWithOwner;

      setLiveItems((prev) => {
        const existingItem = prev.find((item) => item.id === itemId);
        return existingItem
          ? prev.map((item) => (item.id === itemId ? {...item, ...nextItem, requests: item.requests} : item))
          : [nextItem, ...prev];
      });
    }

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_shares",
      }, (payload) => {
        const row = payload.new as {id?: string};
        if (row.id) void fetchAndUpsertItem(row.id);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "community_shares",
      }, (payload) => {
        const row = payload.new as {id?: string};
        if (row.id) void fetchAndUpsertItem(row.id);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "community_shares",
      }, (payload) => {
        const row = payload.old as {id?: string};
        if (row.id) setLiveItems((prev) => prev.filter((item) => item.id !== row.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return liveItems.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (urgency !== "all" && item.urgency_level !== urgency) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!normalized) return true;
      return [item.title, item.description, item.location]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [category, urgency, status, query, liveItems]);

  function openCreate() { setEditingItem(null); setOpen(true); }
  function openEdit(item: FadlaWithOwner) { setEditingItem(item); setOpen(true); }
  function closeForm() { setOpen(false); setEditingItem(null); }

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

      {/* Filters */}
      <section className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card p-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search size={18} className="absolute inset-y-0 start-3 my-auto text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 rounded-full ps-10"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as FadlaCategory | "all")} className="h-12 rounded-full border border-border bg-card px-4 text-sm">
          <option value="all">{t("allCategories")}</option>
          {FADLA_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {t(`categories.${cat}`)}</option>
          ))}
        </select>
        <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="h-12 rounded-full border border-border bg-card px-4 text-sm">
          <option value="all">{t("allUrgency")}</option>
          {URGENCY_OPTIONS.map((u) => (
            <option key={u} value={u}>{t(`urgency.${u}`)}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 rounded-full border border-border bg-card px-4 text-sm">
          <option value="all">{t("allStatus")}</option>
          {["published", "requested", "reserved", "collected", "completed"].map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </section>

      {filteredItems.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <FadlaCard
              key={item.id}
              item={item}
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
                <h2 className="text-xl font-bold">{editingItem ? t("form.editTitle") : t("form.createTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("form.helper")}</p>
              </div>
              <button type="button" onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <ItemForm locale={locale} initialItem={editingItem} onDone={closeForm} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
