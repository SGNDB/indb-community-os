import {createClient} from "@/lib/supabase/server";
import type {ProfileRow} from "@/types/database";

export interface AdminUserGrowthPoint {
  month: string;
  value: number;
}

function sanitizeSearchTerm(search?: string) {
  return search?.trim().replace(/[,%]/g, "") ?? "";
}

function singleProfile(
  value:
    | Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url">
    | Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url">[]
    | null
    | undefined,
) {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export async function getAdminGraatek(search?: string) {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("community_shares")
    .select("id, title, description, status, created_at, owner:profiles!community_shares_owner_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(50);

  if (safeSearch) {
    query = query.ilike("title", `%${safeSearch}%`);
  }

  const {data} = await query;
  return (data ?? []).map((item) => ({
    ...item,
    owner: singleProfile(item.owner),
  }));
}

export async function getAdminGraatekGrowth(): Promise<AdminUserGrowthPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminUserGrowthPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {count} = await supabase
      .from("community_shares")
      .select("*", {count: "exact", head: true})
      .gte("created_at", start)
      .lt("created_at", end);
    points.push({
      month: m.toLocaleDateString("en-US", {month: "short", year: "2-digit"}),
      value: count ?? 0,
    });
  }

  return points;
}
