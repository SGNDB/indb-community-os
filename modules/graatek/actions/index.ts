"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {publishPlatformEvent} from "@/core/events/platform-events";
import {assertFeatureEnabledForMutation} from "@/core/features/server";
import {withLocale} from "@/lib/i18n/paths";
import {routing} from "@/lib/i18n/routing";
import {checkRateLimit} from "@/lib/security/rate-limit";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {fadlaItemSchema} from "@/lib/validations/community";
import {
  createGraatekMessageNotification,
  createGraatekReceiverConfirmedNotification,
  createGraatekRequestAcceptedNotification,
  createGraatekRequestDeclinedNotification,
  createGraatekRequestNotification,
  createGraatekSenderConfirmedNotification,
  createGraatekShareNotification,
} from "@/modules/graatek/actions/notifications";
import type {CommunityShareImage} from "@/modules/graatek/types";

function normalizeLocale(value: FormDataEntryValue | null) {
  const locale = typeof value === "string" ? value : routing.defaultLocale;
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

function toPath(locale: string, pathname: string) {
  return withLocale(pathname, locale);
}

async function guardGraatekAction() {
  try {
    await assertFeatureEnabledForMutation("graatek");
    return null;
  } catch {
    return "module_disabled";
  }
}

function parseShareImages(formData: FormData): CommunityShareImage[] {
  const mediaDataStr = formData.get("mediaData");
  if (typeof mediaDataStr !== "string" || !mediaDataStr) return [];

  try {
    const parsed = JSON.parse(mediaDataStr) as Array<{
      url?: string;
      storagePath?: string;
      type?: "image" | "video";
      mime_type?: string;
      mimeType?: string;
    }>;

    return parsed
      .filter((item) => item.type !== "video" && item.url && item.storagePath)
      .map((item) => ({
        url: item.url as string,
        storagePath: item.storagePath as string,
        type: "image" as const,
        mimeType: item.mimeType ?? item.mime_type ?? "",
      }));
  } catch {
    return [];
  }
}

function parseRemovedShareMedia(formData: FormData): string[] {
  const removedMediaStr = formData.get("removedMedia");
  if (typeof removedMediaStr !== "string" || !removedMediaStr) return [];

  try {
    const parsed = JSON.parse(removedMediaStr);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

async function removeFadlaMedia(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from("fadla-media").remove(paths);
}

export async function submitFadlaItemAction(
  formData: FormData,
): Promise<{success: true; id: string} | {success: false; error: string}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) return {success: false, error: errorsT("submitFailed")};

  const parsed = fadlaItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    location: formData.get("location"),
    quantity: formData.get("quantity"),
    urgency_level: formData.get("urgency_level"),
  });

  if (!parsed.success) return {success: false, error: errorsT("invalidInput")};

  const {data, error} = await supabase
    .from("community_shares")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      condition: parsed.data.condition || null,
      location: parsed.data.location || null,
      quantity: parsed.data.quantity ? Number(parsed.data.quantity) : 1,
      urgency_level: parsed.data.urgency_level || "no_urgency",
      images: parseShareImages(formData),
      status: "published",
    })
    .select("id")
    .single();

  if (error || !data) return {success: false, error: errorsT("submitFailed")};

  revalidatePath(toPath(locale, "/fadla"));
  revalidatePath(toPath(locale, "/profile"));
  return {success: true, id: data.id};
}

export async function updateFadlaItemAction(
  formData: FormData,
): Promise<{success: true} | {success: false; error: string}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const itemId = formData.get("shareId");
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user || typeof itemId !== "string")
    return {success: false, error: errorsT("submitFailed")};

  const {data: existing} = await supabase
    .from("community_shares")
    .select("owner_id, images, status")
    .eq("id", itemId)
    .single();

  if (!existing || existing.owner_id !== user.id)
    return {success: false, error: errorsT("submitFailed")};
  if (existing.status !== "published") return {success: false, error: errorsT("submitFailed")};

  const parsed = fadlaItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    location: formData.get("location"),
    quantity: formData.get("quantity"),
    urgency_level: formData.get("urgency_level"),
  });

  if (!parsed.success) return {success: false, error: errorsT("invalidInput")};

  const removedPaths = parseRemovedShareMedia(formData);
  if (removedPaths.length > 0) await removeFadlaMedia(removedPaths);

  const existingImages = Array.isArray(existing.images)
    ? (existing.images as CommunityShareImage[]).filter(
        (image) => !removedPaths.includes(image.storagePath),
      )
    : [];
  const images = [...existingImages, ...parseShareImages(formData)];

  const {error} = await supabase
    .from("community_shares")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      condition: parsed.data.condition || null,
      location: parsed.data.location || null,
      quantity: parsed.data.quantity ? Number(parsed.data.quantity) : 1,
      urgency_level: parsed.data.urgency_level || "no_urgency",
      images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return {success: false, error: errorsT("submitFailed")};

  revalidatePath(toPath(locale, "/fadla"));
  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function deleteFadlaItemAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const disabled = await guardGraatekAction();
  if (disabled) {
    redirect(toPath(locale, "/fadla?shareError=1"));
  }

  const itemId = formData.get("itemId") || formData.get("shareId");
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user || typeof itemId !== "string") {
    redirect(toPath(locale, "/fadla?shareError=1"));
  }

  const {data: existing} = await supabase
    .from("community_shares")
    .select("owner_id, images")
    .eq("id", itemId)
    .single();

  if (!existing || existing.owner_id !== user.id) {
    redirect(toPath(locale, "/fadla?shareError=1"));
  }

  const images = Array.isArray(existing.images) ? (existing.images as CommunityShareImage[]) : [];
  await removeFadlaMedia(images.map((image) => image.storagePath).filter(Boolean));
  await supabase.from("community_shares").delete().eq("id", itemId);

  revalidatePath(toPath(locale, "/fadla"));
  revalidatePath(toPath(locale, "/profile"));
  redirect(toPath(locale, "/fadla?shareDeleted=1"));
}

export async function requestFadlaItemAction(
  formData: FormData,
): Promise<{success: true; requestId: string; shareStatus: string} | {success: false; error: string}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const fadlaT = await getTranslations({locale, namespace: "Fadla"});
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) return {success: false, error: errorsT("submitFailed")};

  const itemId = formData.get("shareId") || formData.get("itemId");
  if (typeof itemId !== "string") return {success: false, error: errorsT("invalidInput")};

  const {data: item} = await supabase
    .from("community_shares")
    .select("owner_id, status")
    .eq("id", itemId)
    .single();

  if (!item) return {success: false, error: fadlaT("errors.notFound")};
  if (item.owner_id === user.id) return {success: false, error: fadlaT("errors.ownItem")};
  if (item.status !== "published" && item.status !== "requested") {
    return {success: false, error: fadlaT("errors.notAvailable")};
  }

  const {data: existing} = await supabase
    .from("community_share_requests")
    .select("id")
    .eq("share_id", itemId)
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return {success: false, error: fadlaT("errors.alreadyRequested")};

  const requestId = crypto.randomUUID();

  const {error: insertError} = await supabase.from("community_share_requests").insert({
    id: requestId,
    share_id: itemId,
    requester_id: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505")
      return {success: false, error: fadlaT("errors.alreadyRequested")};
    if (insertError.code === "42501") {
      return {success: false, error: fadlaT("errors.notAvailable")};
    }
    return {success: false, error: fadlaT("errors.saveFailed")};
  }

  if (item.status === "published") {
    const adminClient = createAdminClient();
    const statusClient = adminClient ?? supabase;
    const {error: statusError} = await statusClient
      .from("community_shares")
      .update({status: "requested", updated_at: new Date().toISOString()})
      .eq("id", itemId);

    if (statusError) {
      await supabase.from("community_share_requests").delete().eq("id", requestId);
      return {success: false, error: fadlaT("errors.saveFailed")};
    }
  }

  await createGraatekRequestNotification({
    ownerId: item.owner_id,
    requesterId: user.id,
    shareId: itemId,
    requestId,
  });

  await publishPlatformEvent({
    name: "graatek.requested",
    actorId: user.id,
    entityType: "community_share",
    entityId: itemId,
  });

  revalidatePath(toPath(locale, "/fadla"));
  return {
    success: true,
    requestId,
    shareStatus: item.status === "published" ? "requested" : item.status,
  };
}

export async function acceptFadlaRequestAction(
  formData: FormData,
): Promise<
  | {
      success: true;
      requestId: string;
      shareId: string;
      shareStatus: string;
      acceptedRequestId: string;
      conversationId: string;
    }
  | {success: false; error: string}
> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const requestId = formData.get("requestId");
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const fadlaT = await getTranslations({locale, namespace: "Fadla"});

  if (!user || typeof requestId !== "string") {
    return {success: false, error: errorsT("submitFailed")};
  }

  const {data: result, error: rpcError} = await supabase.rpc("accept_fadla_request", {
    p_request_id: requestId,
    p_owner_id: user.id,
  });

  if (rpcError || !result?.success) {
    console.error("accept_fadla_request RPC error:", rpcError, result);
    return {success: false, error: fadlaT("errors.actionFailed")};
  }

  let conversationId = "";
  try {
    const {ensureConversationExists} = await import("@/lib/data/conversations");
    const convId = await ensureConversationExists("graatek", result.shareId as string);
    if (convId) conversationId = convId;
  } catch (e) {
    console.error("acceptFadlaRequestAction conv create error:", e);
  }

  const {data: req} = await supabase
    .from("community_share_requests")
    .select("requester_id")
    .eq("id", requestId)
    .single();

  if (req) {
    await createGraatekRequestAcceptedNotification({
      requesterId: req.requester_id,
      ownerId: user.id,
      shareId: result.shareId as string,
      conversationId,
    });
  }

  revalidatePath(toPath(locale, "/fadla"));
  revalidatePath(toPath(locale, "/profile"));
  return {
    success: true,
    requestId,
    shareId: result.shareId as string,
    shareStatus: "reserved",
    acceptedRequestId: requestId,
    conversationId,
  };
}

export async function confirmFadlaReceivedAction(
  formData: FormData,
): Promise<
  | {
      success: true;
      shareId: string;
      receiverConfirmedAt: string;
      senderConfirmedAt: string | null;
      shareStatus: string;
    }
  | {success: false; error: string}
> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const shareId = formData.get("shareId");
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const fadlaT = await getTranslations({locale, namespace: "Fadla"});

  if (!user || typeof shareId !== "string") {
    return {success: false, error: errorsT("submitFailed")};
  }

  const {data: result, error: rpcError} = await supabase.rpc("confirm_fadla_action", {
    p_share_id: shareId,
    p_user_id: user.id,
    p_confirmation_type: "received",
  });

  if (rpcError || !result?.success) {
    console.error("confirm_fadla_action RPC error:", rpcError, result);
    return {success: false, error: fadlaT("errors.actionFailed")};
  }

  const bothConfirmed = result.bothConfirmed as boolean;

  await createGraatekReceiverConfirmedNotification({
    ownerId: result.ownerId as string,
    receiverId: user.id,
    shareId,
    bothConfirmed,
    title: bothConfirmed ? fadlaT("notifications.bothCompleted") : fadlaT("notifications.receiverConfirmed"),
  });

  if (bothConfirmed) {
    try {
      const {data: conv} = await supabase
        .from("conversations")
        .select("id")
        .eq("graatek_id", shareId)
        .maybeSingle();
      if (conv) {
        await supabase.rpc("archive_conversation", {p_conv_id: conv.id});
      }
    } catch (e) {
      console.error("confirmFadlaReceivedAction archive error:", e);
    }
  }

  if (bothConfirmed) {
    await publishPlatformEvent({
      name: "graatek.completed",
      actorId: user.id,
      entityType: "community_share",
      entityId: shareId,
    });
  }

  return {
    success: true,
    shareId,
    receiverConfirmedAt: result.receiverConfirmedAt as string,
    senderConfirmedAt: result.senderConfirmedAt as string | null,
    shareStatus: result.shareStatus as string,
  };
}

export async function confirmFadlaHandedOverAction(
  formData: FormData,
): Promise<
  | {
      success: true;
      shareId: string;
      senderConfirmedAt: string;
      receiverConfirmedAt: string | null;
      shareStatus: string;
    }
  | {success: false; error: string}
> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const shareId = formData.get("shareId");
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const fadlaT = await getTranslations({locale, namespace: "Fadla"});

  if (!user || typeof shareId !== "string") {
    return {success: false, error: errorsT("submitFailed")};
  }

  const {data: result, error: rpcError} = await supabase.rpc("confirm_fadla_action", {
    p_share_id: shareId,
    p_user_id: user.id,
    p_confirmation_type: "handed_over",
  });

  if (rpcError || !result?.success) {
    console.error("confirm_fadla_action RPC error:", rpcError, result);
    return {success: false, error: fadlaT("errors.actionFailed")};
  }

  const bothConfirmed = result.bothConfirmed as boolean;

  const {data: share} = await supabase
    .from("community_shares")
    .select("accepted_request_id, owner_id")
    .eq("id", shareId)
    .single();

  if (share?.accepted_request_id) {
    const {data: req} = await supabase
      .from("community_share_requests")
      .select("requester_id")
      .eq("id", share.accepted_request_id)
      .single();

    if (req) {
      await createGraatekSenderConfirmedNotification({
        requesterId: req.requester_id,
        ownerId: user.id,
        shareId,
        bothConfirmed,
        title: bothConfirmed ? fadlaT("notifications.bothCompleted") : fadlaT("notifications.senderConfirmed"),
      });
    }
  }

  if (bothConfirmed) {
    try {
      const {data: conv} = await supabase
        .from("conversations")
        .select("id")
        .eq("graatek_id", shareId)
        .maybeSingle();
      if (conv) {
        await supabase.rpc("archive_conversation", {p_conv_id: conv.id});
      }
    } catch (e) {
      console.error("confirmFadlaHandedOverAction archive error:", e);
    }
  }

  if (bothConfirmed) {
    await publishPlatformEvent({
      name: "graatek.completed",
      actorId: user.id,
      entityType: "community_share",
      entityId: shareId,
    });
  }

  return {
    success: true,
    shareId,
    senderConfirmedAt: result.senderConfirmedAt as string,
    receiverConfirmedAt: result.receiverConfirmedAt as string | null,
    shareStatus: result.shareStatus as string,
  };
}

export async function declineFadlaRequestAction(
  formData: FormData,
): Promise<{success: true; requestId: string; shareId: string; shareStatus: string} | {success: false; error: string}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const locale = normalizeLocale(formData.get("locale"));
  const requestId = formData.get("requestId");
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  const errorsT = await getTranslations({locale, namespace: "Errors"});
  const fadlaT = await getTranslations({locale, namespace: "Fadla"});

  if (!user || typeof requestId !== "string") {
    return {success: false, error: errorsT("submitFailed")};
  }

  const {data: req} = await supabase
    .from("community_share_requests")
    .select("id, share_id, requester_id, status")
    .eq("id", requestId)
    .single();

  if (!req || req.status !== "pending") {
    return {success: false, error: fadlaT("errors.notFound")};
  }

  const {data: item} = await supabase
    .from("community_shares")
    .select("owner_id")
    .eq("id", req.share_id)
    .single();

  if (!item || item.owner_id !== user.id) {
    return {success: false, error: errorsT("submitFailed")};
  }

  const now = new Date().toISOString();

  await supabase
    .from("community_share_requests")
    .update({status: "declined", updated_at: now})
    .eq("id", requestId);

  await createGraatekRequestDeclinedNotification({
    requesterId: req.requester_id,
    ownerId: user.id,
    shareId: req.share_id,
  });

  const {count: remaining} = await supabase
    .from("community_share_requests")
    .select("*", {count: "exact", head: true})
    .eq("share_id", req.share_id)
    .eq("status", "pending");

  if (!remaining || remaining === 0) {
    await supabase
      .from("community_shares")
      .update({status: "published", updated_at: now})
      .eq("id", req.share_id);
  }

  revalidatePath(toPath(locale, "/fadla"));
  revalidatePath(toPath(locale, "/profile"));
  return {
    success: true,
    requestId,
    shareId: req.share_id,
    shareStatus: !remaining || remaining === 0 ? "published" : "requested",
  };
}

export async function sendFadlaMessageAction(
  formData: FormData,
): Promise<{success: true; message: {id: string; created_at: string}} | {success: false; error: string}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const localeRaw = formData.get("locale");
  const shareId = formData.get("shareId");
  const requestId = formData.get("requestId");
  const message = formData.get("message");
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (!user || typeof localeRaw !== "string" || typeof shareId !== "string" || typeof requestId !== "string" || typeof message !== "string") {
    return {success: false, error: "submitFailed"};
  }

  const locale = localeRaw;

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 500) {
    return {success: false, error: "submitFailed"};
  }

  const {allowed} = await checkRateLimit("fadla_message", user.id);
  if (!allowed) {
    return {success: false, error: "rate_limited"};
  }

  const item = await supabase
    .from("community_shares")
    .select("owner_id, title, accepted_request_id, status")
    .eq("id", shareId)
    .single()
    .then((r) => r.data);

  if (!item || item.accepted_request_id !== requestId) {
    return {success: false, error: "submitFailed"};
  }

  if (item.status === "completed") {
    return {success: false, error: "submitFailed"};
  }

  const requestRow = await supabase
    .from("community_share_requests")
    .select("requester_id, status")
    .eq("id", requestId)
    .single()
    .then((r) => r.data);

  if (!requestRow || requestRow.status !== "accepted") {
    return {success: false, error: "submitFailed"};
  }

  const isOwner = item.owner_id === user.id;
  const isRequester = requestRow.requester_id === user.id;
  if (!isOwner && !isRequester) {
    return {success: false, error: "submitFailed"};
  }

  const {data: newMessage, error} = await supabase
    .from("fadla_request_messages")
    .insert({share_id: shareId, request_id: requestId, sender_id: user.id, message: trimmed})
    .select("id, created_at")
    .single();

  if (error || !newMessage) {
    console.error("sendFadlaMessageAction error:", error);
    return {success: false, error: "submitFailed"};
  }

  try {
    const {ensureConversationExists, sendConversationMessage} = await import("@/lib/data/conversations");
    const convId = await ensureConversationExists("graatek", shareId);
    if (convId) {
      await sendConversationMessage(convId, user.id, trimmed);
    }
  } catch (e) {
    console.error("sendFadlaMessageAction conv sync error:", e);
  }

  const otherUserId = isOwner ? requestRow.requester_id : item.owner_id;
  await createGraatekMessageNotification({
    recipientId: otherUserId,
    senderId: user.id,
    shareId,
    requestId,
    messagePreview: trimmed.slice(0, 100),
  });

  revalidatePath(toPath(locale, "/fadla"));
  return {success: true, message: {id: newMessage.id, created_at: newMessage.created_at}};
}

export async function shareCommunityShareAction(
  formData: FormData,
): Promise<{success: boolean; error?: string; sharesCount?: number}> {
  const disabled = await guardGraatekAction();
  if (disabled) return {success: false, error: disabled};

  const shareId = formData.get("shareId");
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return {success: false, error: "unauthorized"};
  }

  if (typeof shareId !== "string") {
    return {success: false, error: "invalid"};
  }

  const {data: share} = await supabase
    .from("community_shares")
    .select("owner_id")
    .eq("id", shareId)
    .single();

  if (!share) {
    return {success: false, error: "not_found"};
  }

  const {data: sharesCount, error: shareCountError} = await supabase.rpc(
    "increment_share_count",
    {
      p_entity_type: "community_share",
      p_entity_id: shareId,
    },
  );

  if (shareCountError || typeof sharesCount !== "number") {
    console.error("shareCommunityShareAction increment_share_count error:", shareCountError);
    return {success: false, error: "share_count_failed"};
  }

  if (share.owner_id !== user.id) {
    await createGraatekShareNotification({
      ownerId: share.owner_id,
      actorId: user.id,
      shareId,
    });
  }

  return {success: true, sharesCount};
}

export async function submitCommunityShareAction(formData: FormData) {
  return submitFadlaItemAction(formData);
}

export async function updateCommunityShareAction(formData: FormData) {
  return updateFadlaItemAction(formData);
}

export async function deleteCommunityShareAction(formData: FormData) {
  return deleteFadlaItemAction(formData);
}

export async function requestCommunityShareAction(formData: FormData) {
  return requestFadlaItemAction(formData);
}
