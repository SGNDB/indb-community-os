import {createNotification} from "@/lib/data/notifications";
import {createClient} from "@/lib/supabase/server";

async function shouldCreateReactionNotification(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("user_settings")
    .select("in_app_notifications")
    .eq("user_id", userId)
    .maybeSingle();

  const settings = data?.in_app_notifications as {reactions?: boolean} | null | undefined;
  return settings?.reactions !== false;
}

export async function upsertMemoryReactionNotification(
  memoryContributorId: string,
  actorId: string,
  memoryId: string,
): Promise<void> {
  if (memoryContributorId === actorId) return;
  if (!(await shouldCreateReactionNotification(memoryContributorId))) return;

  const supabase = await createClient();
  const {data: existing} = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", memoryContributorId)
    .eq("actor_id", actorId)
    .eq("type", "reaction")
    .eq("entity_type", "memory")
    .eq("entity_id", memoryId)
    .maybeSingle();

  if (existing) {
    const {error} = await supabase
      .from("notifications")
      .update({created_at: new Date().toISOString(), read: false})
      .eq("id", existing.id);
    if (error) console.error("upsertMemoryReactionNotification update error:", error);
    return;
  }

  const {error} = await supabase.from("notifications").insert({
    user_id: memoryContributorId,
    actor_id: actorId,
    type: "reaction",
    entity_type: "memory",
    entity_id: memoryId,
    title: "New reaction to your memory",
    message: null,
  });
  if (error) console.error("upsertMemoryReactionNotification insert error:", error);
}

export async function createMemoryCommentNotification(
  memoryContributorId: string,
  actorId: string,
  memoryId: string,
  commentId?: string,
): Promise<void> {
  if (memoryContributorId === actorId) return;

  await createNotification({
    userId: memoryContributorId,
    actorId,
    type: "memory_comment",
    entityType: "memory",
    entityId: memoryId,
    title: "New comment on your memory",
    metadata: commentId ? {commentId} : {},
  });
}
