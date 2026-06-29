import {createClient} from "@/lib/supabase/server";
import type {CommentWithAuthor} from "@/types/database";

export async function getCommentsByPost(
  postId: string,
  limit = 10,
): Promise<CommentWithAuthor[]> {
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
    .order("created_at", {ascending: true})
    .limit(limit);

  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function getCommentsByPostPage(
  postId: string,
  page = 1,
  pageSize = 5,
): Promise<{
  items: CommentWithAuthor[];
  hasMore: boolean;
  total: number;
}> {
  const supabase = await createClient();

  const {count} = await supabase
    .from("comments")
    .select("*", {count: "exact", head: true})
    .eq("post_id", postId)
    .eq("status", "published")
    .not("author_id", "is", null);

  const from = (page - 1) * pageSize;
  const {data} = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("post_id", postId)
    .eq("status", "published")
    .not("author_id", "is", null)
    .order("created_at", {ascending: true})
    .range(from, from + pageSize - 1);

  return {
    items: (data ?? []) as unknown as CommentWithAuthor[],
    hasMore: (count ?? 0) > page * pageSize,
    total: count ?? 0,
  };
}

export async function getCommentsForPosts(
  postIds: string[],
  maxCommentsPerPost = 100,
): Promise<Record<string, CommentWithAuthor[]>> {
  if (postIds.length === 0) return {};

  const supabase = await createClient();

  const {data} = await supabase.rpc("get_comments_for_posts", {
    p_post_ids: postIds,
    p_max_per_post: maxCommentsPerPost,
  });

  const grouped: Record<string, CommentWithAuthor[]> = {};
  for (const comment of ((data ?? []) as unknown as CommentWithAuthor[])) {
    if (!grouped[comment.post_id]) {
      grouped[comment.post_id] = [];
    }
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
