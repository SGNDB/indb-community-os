import {createClient} from "@/lib/supabase/server";
import type {ReactionType} from "@/types/database";

export async function getUserReaction(
  postId: string,
  userId: string,
): Promise<ReactionType | null> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.reaction_type ?? null;
}

export async function toggleReaction(
  postId: string,
  userId: string,
  reactionType: ReactionType,
): Promise<{action: "inserted" | "updated" | "deleted"}> {
  const supabase = await createClient();

  const {data: existing} = await supabase
    .from("post_reactions")
    .select("id, reaction_type")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await supabase.from("post_reactions").delete().eq("id", existing.id);
      return {action: "deleted"};
    } else {
      await supabase
        .from("post_reactions")
        .update({reaction_type: reactionType, updated_at: new Date().toISOString()})
        .eq("id", existing.id);
      return {action: "updated"};
    }
  } else {
    await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    });
    return {action: "inserted"};
  }
}

export async function getReactionCounts(
  postId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", postId);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
  }
  return counts;
}
