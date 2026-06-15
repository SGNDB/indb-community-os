import {createClient} from "@/lib/supabase/server";
import {getFollowStats} from "@/lib/data/follows";
import type {ProfileRow, ProfileWithCounts} from "@/types/database";

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data as ProfileRow | null;
}

export async function getProfileWithCounts(userId: string): Promise<ProfileWithCounts | null> {
  const supabase = await createClient();

  const {data: profile} = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const {count: postsCount} = await supabase
    .from("posts")
    .select("*", {count: "exact", head: true})
    .eq("author_id", userId);

  const {count: memoriesCount} = await supabase
    .from("memories")
    .select("*", {count: "exact", head: true})
    .eq("contributor_id", userId);

  const {count: ideasCount} = await supabase
    .from("ideas")
    .select("*", {count: "exact", head: true})
    .eq("author_id", userId);

  const {count: commentsCount} = await supabase
    .from("comments")
    .select("*", {count: "exact", head: true})
    .eq("author_id", userId);

  const {count: sharesCount} = await supabase
    .from("community_shares")
    .select("*", {count: "exact", head: true})
    .eq("owner_id", userId);

  const followStats = await getFollowStats(userId);

  return {
    ...(profile as ProfileRow),
    posts_count: postsCount ?? 0,
    memories_count: memoriesCount ?? 0,
    ideas_count: ideasCount ?? 0,
    comments_count: commentsCount ?? 0,
    shares_count: sharesCount ?? 0,
    followers_count: followStats.followersCount,
    following_count: followStats.followingCount,
  };
}

export async function getProfilesCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("profiles")
    .select("*", {count: "exact", head: true});
  return count ?? 0;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return null;
  return getProfile(user.id);
}

export async function getProfileByUsername(username: string): Promise<ProfileRow | null> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (data) return data as ProfileRow;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(username)) return null;

  const {data: profileById} = await supabase
    .from("profiles")
    .select("*")
    .eq("id", username)
    .maybeSingle();

  return profileById as ProfileRow | null;
}
