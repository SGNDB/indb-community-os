import {createClient} from "@/lib/supabase/server";
import type {NotificationWithActor, UserNotificationKey} from "@/types/database";

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("notifications")
    .select("id", {count: "exact", head: true})
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

export async function getUserNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationWithActor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(id, username, full_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", {ascending: false})
    .limit(limit);

  return (data as unknown as NotificationWithActor[]) ?? [];
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({read: true})
    .eq("id", notificationId);
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({read: true})
    .eq("user_id", userId)
    .eq("read", false);
}

type CreateNotificationParams = {
  userId: string;
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

function notificationPreferenceKey(type: string): UserNotificationKey | null {
  if (type.includes("message")) return "messages";
  if (type.includes("comment")) return "comments";
  if (type.includes("reaction")) return "reactions";
  if (type === "follow") return "followers";
  if (type.includes("graatek") || type.includes("fadla")) return "graatek";
  if (type.includes("campaign") || type.includes("donation")) return "campaigns";
  if (type.includes("volunteer")) return "volunteer";
  if (type.includes("announcement") || type.includes("system")) return "announcements";
  return null;
}

async function shouldCreateInAppNotification(
  userId: string,
  type: string,
  supabase = createClient(),
): Promise<boolean> {
  const key = notificationPreferenceKey(type);
  if (!key) return true;

  const client = await supabase;
  const {data} = await client
    .from("user_settings")
    .select("in_app_notifications")
    .eq("user_id", userId)
    .maybeSingle();

  const settings = data?.in_app_notifications as Partial<Record<UserNotificationKey, boolean>> | null | undefined;
  return settings?.[key] !== false;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  if (params.userId === params.actorId) return;

  const supabase = await createClient();
  if (!(await shouldCreateInAppNotification(params.userId, params.type, Promise.resolve(supabase)))) return;

  // Dedup: skip if an unread notification for the same event already exists
  const {data: existing} = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", params.userId)
    .eq("actor_id", params.actorId)
    .eq("type", params.type)
    .eq("entity_type", params.entityType)
    .eq("entity_id", params.entityId)
    .eq("read", false)
    .maybeSingle();

  if (existing) return;
  const {data: actor} = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", params.actorId)
    .maybeSingle();

  const actorName = actor?.full_name ?? actor?.username ?? null;
  const metadata = {
    ...(params.metadata ?? {}),
    ...(actorName ? {actorName} : {}),
    ...(actor?.avatar_url ? {actorAvatarUrl: actor.avatar_url} : {}),
  };

  const payload = {
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    entity_type: params.entityType,
    entity_id: params.entityId,
    title: params.title,
    message: params.message ?? null,
    metadata,
  };

  let {error} = await supabase.from("notifications").insert(payload);

  if (error && error.code === "PGRST204") {
    const legacyPayload = {...payload};
    delete (legacyPayload as Partial<typeof payload>).metadata;
    const retry = await supabase.from("notifications").insert(legacyPayload);
    error = retry.error;
  }

  if (error) console.error("createNotification error:", error);
}

export async function createFollowNotification(
  followerId: string,
  followedUserId: string,
): Promise<void> {
  if (followedUserId === followerId) return;

  await createNotification({
    userId: followedUserId,
    actorId: followerId,
    type: "follow",
    entityType: "profile",
    entityId: followerId,
    title: "New follower",
  });
}

export async function upsertReactionNotification(
  postAuthorId: string,
  actorId: string,
  postId: string,
): Promise<void> {
  if (postAuthorId === actorId) return;

  const supabase = await createClient();
  if (!(await shouldCreateInAppNotification(postAuthorId, "reaction", Promise.resolve(supabase)))) return;

  const {data: existing} = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", postAuthorId)
    .eq("actor_id", actorId)
    .eq("type", "reaction")
    .eq("entity_type", "post")
    .eq("entity_id", postId)
    .maybeSingle();

  if (existing) {
    const {error} = await supabase
      .from("notifications")
      .update({created_at: new Date().toISOString(), read: false})
      .eq("id", existing.id);
    if (error) console.error("upsertReactionNotification update error:", error);
  } else {
    const {error} = await supabase.from("notifications").insert({
      user_id: postAuthorId,
      actor_id: actorId,
      type: "reaction",
      entity_type: "post",
      entity_id: postId,
      title: "New reaction",
      message: null,
    });
    if (error) console.error("upsertReactionNotification insert error:", error);
  }
}

export async function createShareNotification(
  ideaAuthorId: string,
  actorId: string,
  ideaId: string,
): Promise<void> {
  if (ideaAuthorId === actorId) return;

  const supabase = await createClient();
  if (!(await shouldCreateInAppNotification(ideaAuthorId, "share", Promise.resolve(supabase)))) return;

  const {error} = await supabase.from("notifications").insert({
    user_id: ideaAuthorId,
    actor_id: actorId,
    type: "share",
    entity_type: "idea",
    entity_id: ideaId,
    title: "Shared your idea",
    message: null,
  });

  if (error) console.error("createShareNotification error:", error);
}

export async function createIdeaCommentNotification(
  ideaAuthorId: string,
  actorId: string,
  ideaId: string,
  commentId?: string,
): Promise<void> {
  if (ideaAuthorId === actorId) return;

  await createNotification({
    userId: ideaAuthorId,
    actorId,
    type: "idea_comment",
    entityType: "idea",
    entityId: ideaId,
    title: "New comment on your idea",
    metadata: commentId ? {commentId} : {},
  });
}

export {
  createMemoryCommentNotification,
  upsertMemoryReactionNotification,
} from "@/modules/memories/actions/notifications";

export async function createCommentNotification(
  postAuthorId: string,
  actorId: string,
  postId: string,
  commentId?: string,
): Promise<void> {
  if (postAuthorId === actorId) return;

  await createNotification({
    userId: postAuthorId,
    actorId,
    type: "comment",
    entityType: "post",
    entityId: postId,
    title: "New comment",
    metadata: commentId ? {commentId} : {},
  });
}

export async function createIdeaSupportNotification(
  ideaAuthorId: string,
  actorId: string,
  ideaId: string,
): Promise<void> {
  if (ideaAuthorId === actorId) return;
  await createNotification({
    userId: ideaAuthorId,
    actorId,
    type: "idea_support",
    entityType: "idea",
    entityId: ideaId,
    title: "New supporter on your idea",
  });
}

export async function createIdeaParticipateRequestNotification(
  ideaAuthorId: string,
  actorId: string,
  ideaId: string,
): Promise<void> {
  if (ideaAuthorId === actorId) return;
  await createNotification({
    userId: ideaAuthorId,
    actorId,
    type: "idea_participate_request",
    entityType: "idea",
    entityId: ideaId,
    title: "Someone wants to join your project",
  });
}

export async function createIdeaParticipantAcceptedNotification(
  participantUserId: string,
  actorId: string,
  ideaId: string,
  conversationId?: string,
): Promise<void> {
  if (participantUserId === actorId) return;
  await createNotification({
    userId: participantUserId,
    actorId,
    type: "idea_participant_accepted",
    entityType: "idea",
    entityId: ideaId,
    title: conversationId ? 'participantAcceptedMessage' : "You were accepted to participate",
    metadata: conversationId ? { conversationId } : undefined,
  });
}

export async function createIdeaParticipantDeclinedNotification(
  participantUserId: string,
  actorId: string,
  ideaId: string,
): Promise<void> {
  if (participantUserId === actorId) return;
  await createNotification({
    userId: participantUserId,
    actorId,
    type: "idea_participant_declined",
    entityType: "idea",
    entityId: ideaId,
    title: "Your participation request was declined",
  });
}

export async function createIdeaMessageNotification(
  ideaId: string,
  senderId: string,
  participantUserIds: string[],
): Promise<void> {
  for (const userId of participantUserIds) {
    if (userId === senderId) continue;
    await createNotification({
      userId,
      actorId: senderId,
      type: "idea_message",
      entityType: "idea",
      entityId: ideaId,
      title: "New message in idea discussion",
    });
  }
}

export async function createIdeaStatusChangeNotification(
  ideaId: string,
  actorId: string,
  participantUserIds: string[],
  newStatus: string,
): Promise<void> {
  for (const userId of participantUserIds) {
    if (userId === actorId) continue;
    await createNotification({
      userId,
      actorId,
      type: "idea_status_change",
      entityType: "idea",
      entityId: ideaId,
      title: `Idea status changed to ${newStatus}`,
    });
  }
}
