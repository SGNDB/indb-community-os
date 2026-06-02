import {createClient} from "@/lib/supabase/server";
import type {PostWithAuthor} from "@/types/database";

async function attachUserReactions(
  posts: PostWithAuthor[],
  currentUserId?: string | null,
): Promise<PostWithAuthor[]> {
  if (!currentUserId || posts.length === 0) return posts;

  const supabase = await createClient();
  const postIds = posts.map((p) => p.id);

  const {data: reactions} = await supabase
    .from("post_likes")
    .select("post_id, reaction_type")
    .in("post_id", postIds)
    .eq("user_id", currentUserId);

  const reactionMap = new Map(
    reactions?.map((r) => [r.post_id, r.reaction_type]) ?? [],
  );

  for (const post of posts) {
    (post as PostWithAuthor & {user_reaction: string | null}).user_reaction =
      reactionMap.get(post.id) ?? null;
  }

  return posts;
}

export async function getPosts(
  currentUserId?: string | null,
): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar)
    `)
    .eq("status", "published")
    .order("created_at", {ascending: false});

  return attachUserReactions((data ?? []) as unknown as PostWithAuthor[], currentUserId);
}

export async function getPostById(
  id: string,
  currentUserId?: string | null,
): Promise<PostWithAuthor | null> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar)
    `)
    .eq("id", id)
    .single();

  const posts = data
    ? (await attachUserReactions(
        [data] as unknown as PostWithAuthor[],
        currentUserId,
      ))
    : [];

  return posts[0] ?? null;
}

export async function getUserPosts(
  userId: string,
  currentUserId?: string | null,
): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar)
    `)
    .eq("author_id", userId)
    .order("created_at", {ascending: false});

  return attachUserReactions((data ?? []) as unknown as PostWithAuthor[], currentUserId);
}

export async function getPostsCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("posts")
    .select("*", {count: "exact", head: true})
    .eq("status", "published");
  return count ?? 0;
}

export async function getPostsTodayCount(): Promise<number> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {count} = await supabase
    .from("posts")
    .select("*", {count: "exact", head: true})
    .eq("status", "published")
    .gte("created_at", today.toISOString());

  return count ?? 0;
}
