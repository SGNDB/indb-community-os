"use server";

import {getFollowers, getFollowing} from "@/lib/data/follows";
import {createClient} from "@/lib/supabase/server";

export async function getFollowersAction(
  targetUserId: string,
  page: number = 1,
  searchQuery: string = "",
) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  return getFollowers(targetUserId, user?.id ?? null, page, 30, searchQuery);
}

export async function getFollowingAction(
  targetUserId: string,
  page: number = 1,
  searchQuery: string = "",
) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  return getFollowing(targetUserId, user?.id ?? null, page, 30, searchQuery);
}
