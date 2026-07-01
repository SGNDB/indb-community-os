import {createClient} from "@/lib/supabase/server";
import type {ProfileRow} from "@/types/database";

type AdminMemoryContributor = Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url">;

function sanitizeSearchTerm(search?: string) {
  return search?.trim().replace(/[,%]/g, "") ?? "";
}

function singleProfile(
  value: AdminMemoryContributor | AdminMemoryContributor[] | null | undefined,
): AdminMemoryContributor | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getAdminMemories(search?: string) {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("memories")
    .select("id, title, description, verification_status, reactions_count, comments_count, created_at, contributor:profiles!memories_contributor_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(50);

  if (safeSearch) {
    query = query.ilike("title", `%${safeSearch}%`);
  }

  const {data} = await query;
  return (data ?? []).map((memory) => ({
    ...memory,
    contributor: singleProfile(memory.contributor),
  }));
}
