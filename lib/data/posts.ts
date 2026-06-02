import {createClient} from "@/lib/supabase/server";
import type {PostWithAuthor} from "@/types/database";

async function attachUserReactions(
  posts: PostWithAuthor[],
  currentUserId?: string | null,
): Promise<PostWithAuthor[]> {
  if (posts.length === 0) return posts;

  const supabase = await createClient();
  const postIds = posts.map((p) => p.id);

  const {data: allReactions} = await supabase
    .from("post_reactions")
    .select("post_id, user_id, reaction_type")
    .in("post_id", postIds);

  const userReactionMap = new Map<string, string>();
  const countsMap = new Map<string, Record<string, number>>();

  for (const row of allReactions ?? []) {
    if (currentUserId && row.user_id === currentUserId) {
      userReactionMap.set(row.post_id, row.reaction_type);
    }
    if (!countsMap.has(row.post_id)) {
      countsMap.set(row.post_id, {});
    }
    const counts = countsMap.get(row.post_id)!;
    counts[row.reaction_type] = (counts[row.reaction_type] ?? 0) + 1;
  }

  // Check saved posts for current user
  const savedSet = new Set<string>();
  if (currentUserId) {
    const {data: savedData} = await supabase
      .from("saved_posts")
      .select("post_id")
      .in("post_id", postIds)
      .eq("user_id", currentUserId);
    for (const row of savedData ?? []) {
      savedSet.add(row.post_id);
    }
  }

  for (const post of posts) {
    (post as PostWithAuthor & {user_reaction: string | null}).user_reaction =
      (userReactionMap.get(post.id) as PostWithAuthor["user_reaction"]) ?? null;
    post.reaction_counts = countsMap.get(post.id) ?? {};
    post.user_saved = savedSet.has(post.id);
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
