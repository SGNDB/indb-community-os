import {createClient} from "@/lib/supabase/server";
import type {MemoryCommentWithAuthor, MemoryWithContributor} from "@/types/database";

export async function getVisibleMemories(): Promise<MemoryWithContributor[]> {
  const supabase = await createClient();

  const approvedQuery = supabase
    .from("memories")
    .select(`
      *,
      contributor:profiles!memories_contributor_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("verification_status", "approved")
    .order("year", {ascending: false});

  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    const {data} = await approvedQuery;
    return (data ?? []) as unknown as MemoryWithContributor[];
  }

  const [approvedRes, ownRes] = await Promise.all([
    approvedQuery,
    supabase
      .from("memories")
      .select(`
        *,
        contributor:profiles!memories_contributor_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq("contributor_id", user.id)
      .neq("verification_status", "approved")
      .order("year", {ascending: false}),
  ]);

  const approved = (approvedRes.data ?? []) as unknown as MemoryWithContributor[];
  const own = (ownRes.data ?? []) as unknown as MemoryWithContributor[];

  const seen = new Set(approved.map((m) => m.id));
  for (const memory of own) {
    if (!seen.has(memory.id)) {
      approved.push(memory);
    }
  }

  approved.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return approved;
}

export async function getApprovedMemories(): Promise<MemoryWithContributor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("memories")
    .select(`
      *,
      contributor:profiles!memories_contributor_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("verification_status", "approved")
    .order("year", {ascending: false});

  return (data ?? []) as unknown as MemoryWithContributor[];
}

export async function getMemoryById(id: string): Promise<MemoryWithContributor | null> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("memories")
    .select(`
      *,
      contributor:profiles!memories_contributor_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  return data as unknown as MemoryWithContributor | null;
}

export async function getPendingMemoriesCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("memories")
    .select("*", {count: "exact", head: true})
    .eq("verification_status", "pending");
  return count ?? 0;
}

export async function getMemoriesCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("memories")
    .select("*", {count: "exact", head: true})
    .eq("verification_status", "approved");
  return count ?? 0;
}

export async function getMemoryComments(
  memoryId: string,
): Promise<MemoryCommentWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("memory_comments")
    .select("*, author:profiles!memory_comments_author_id_fkey(id, username, full_name, avatar_url)")
    .eq("memory_id", memoryId)
    .order("created_at", {ascending: true});

  return (data ?? []) as unknown as MemoryCommentWithAuthor[];
}

export async function getMemoryCommentCount(memoryId: string): Promise<number> {
  const supabase = await createClient();

  const {count} = await supabase
    .from("memory_comments")
    .select("*", {count: "exact", head: true})
    .eq("memory_id", memoryId);

  return count ?? 0;
}

export async function getUserMemories(userId: string): Promise<MemoryWithContributor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("memories")
    .select(`
      *,
      contributor:profiles!memories_contributor_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("contributor_id", userId)
    .order("created_at", {ascending: false});

  return (data ?? []) as unknown as MemoryWithContributor[];
}
