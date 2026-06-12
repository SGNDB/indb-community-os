import {createClient} from "@/lib/supabase/server";
import type {CommentWithAuthor} from "@/types/database";

export async function getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("post_id", postId)
    .eq("status", "published")
    .not("author_id", "is", null)
    .order("created_at", {ascending: true});

  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function getCommentsForPosts(postIds: string[]): Promise<Record<string, CommentWithAuthor[]>> {
  if (postIds.length === 0) return {};

  const supabase = await createClient();

  const {data} = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
    `)
    .in("post_id", postIds)
    .eq("status", "published")
    .not("author_id", "is", null)
    .order("created_at", {ascending: true});

  const grouped: Record<string, CommentWithAuthor[]> = {};
  for (const comment of ((data ?? []) as unknown as CommentWithAuthor[])) {
    grouped[comment.post_id] = grouped[comment.post_id] ?? [];
    grouped[comment.post_id].push(comment);
  }

  return grouped;
}

export async function getCommentsCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("comments")
    .select("*", {count: "exact", head: true})
    .eq("status", "published")
    .not("author_id", "is", null);
  return count ?? 0;
}
