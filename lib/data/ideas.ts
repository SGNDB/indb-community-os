import {createClient} from "@/lib/supabase/server";
import {calculateIdeaSupport} from "@/lib/ideas/support";
import {getTotalActiveUsers} from "@/lib/data/stats";
import type {IdeaCommentWithAuthor, IdeaMediaRow, IdeaMessageWithSender, IdeaParticipantWithUser, IdeaWithAuthor, IdeaWithSupport} from "@/types/database";

const DEFAULT_PAGE_SIZE = 20;

async function attachIdeaMedia(ideas: IdeaWithAuthor[]): Promise<IdeaWithAuthor[]> {
  if (ideas.length === 0) return ideas;
  const supabase = await createClient();
  const ideaIds = ideas.map((i) => i.id);

  const {data: mediaRows} = await supabase
    .from("idea_media")
    .select("*")
    .in("idea_id", ideaIds)
    .order("position", {ascending: true});

  const mediaMap = new Map<string, IdeaMediaRow[]>();
  for (const row of mediaRows ?? []) {
    const list = mediaMap.get(row.idea_id) ?? [];
    list.push(row as IdeaMediaRow);
    mediaMap.set(row.idea_id, list);
  }

  for (const idea of ideas) {
    idea.media = mediaMap.get(idea.id) ?? [];
  }

  return ideas;
}

export async function getIdeas(limit = 10): Promise<{ideas: IdeaWithSupport[]; totalUsers: number}> {
  const page = await getIdeasPage({pageSize: limit});
  return {ideas: page.ideas, totalUsers: page.totalUsers};
}

export async function getIdeasPage({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  ideas: IdeaWithSupport[];
  totalUsers: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}> {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize;

  const {data} = await supabase
    .from("ideas")
    .select(`
      *,
      author:profiles!ideas_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar, name_ff, name_snk, name_wo)
    `)
    .not("author_id", "is", null)
    .order("votes_count", {ascending: false})
    .order("created_at", {ascending: false})
    .range(from, to);

  const rows = (data ?? []) as unknown as IdeaWithAuthor[];
  const ideas = rows.slice(0, safePageSize);
  await attachIdeaMedia(ideas);
  const totalUsers = await getTotalActiveUsers();

  const withSupport: IdeaWithSupport[] = ideas.map((idea) => {
    const {supportPercentage, badge} = calculateIdeaSupport(idea.votes_count, totalUsers);
    return {...idea, supportPercentage, badge, rank: null};
  });

  for (let i = 0; i < withSupport.length && i < 10; i++) {
    withSupport[i].rank = safePage === 1 ? i + 1 : null;
  }

  return {
    ideas: withSupport,
    totalUsers,
    page: safePage,
    pageSize: safePageSize,
    hasNextPage: rows.length > safePageSize,
    hasPreviousPage: safePage > 1,
  };
}

export async function getUserIdeasCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("ideas")
    .select("*", {count: "exact", head: true})
    .eq("author_id", userId);
  return count ?? 0;
}

export async function getUserIdeas(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<IdeaWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("ideas")
    .select(`
      *,
      author:profiles!ideas_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar, name_ff, name_snk, name_wo)
    `)
    .eq("author_id", userId)
    .order("created_at", {ascending: false})
    .range((page - 1) * pageSize, page * pageSize);

  const ideas = (data ?? []) as unknown as IdeaWithAuthor[];
  return attachIdeaMedia(ideas);
}

export async function getIdeaById(id: string): Promise<IdeaWithAuthor | null> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("ideas")
    .select(`
      *,
      author:profiles!ideas_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar, name_ff, name_snk, name_wo)
    `)
    .eq("id", id)
    .not("author_id", "is", null)
    .single();

  if (!data) return null;
  const ideas = [data] as unknown as IdeaWithAuthor[];
  await attachIdeaMedia(ideas);
  return ideas[0] ?? null;
}

export async function getIdeaComments(
  ideaId: string,
  limit = 10,
): Promise<IdeaCommentWithAuthor[]> {
  const supabase = await createClient();

  const {data} = await supabase
    .from("idea_comments")
    .select("*, author:profiles!idea_comments_author_id_fkey(id, username, full_name, avatar_url)")
    .eq("idea_id", ideaId)
    .not("author_id", "is", null)
    .order("created_at", {ascending: true})
    .limit(limit);

  return (data ?? []) as unknown as IdeaCommentWithAuthor[];
}

export async function getIdeaCommentCount(ideaId: string): Promise<number> {
  const supabase = await createClient();

  const {count} = await supabase
    .from("idea_comments")
    .select("*", {count: "exact", head: true})
    .eq("idea_id", ideaId);

  return count ?? 0;
}

export async function getIdeasCount(): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("ideas")
    .select("*", {count: "exact", head: true})
    .not("author_id", "is", null);
  return count ?? 0;
}

export async function getIdeaVoteDetails(ideaId: string, limit = 50, offset = 0) {
  const supabase = await createClient();

  const {count} = await supabase
    .from("idea_votes")
    .select("id", {count: "exact", head: true})
    .eq("idea_id", ideaId);

  const {data: voters} = await supabase
    .from("idea_votes")
    .select(`
      user_id,
      created_at,
      profile:profiles(full_name, username, avatar_url)
    `)
    .eq("idea_id", ideaId)
    .order("created_at", {ascending: false})
    .range(offset, offset + limit - 1);

  return {
    totalCount: count ?? 0,
    voters: (voters ?? []).map((v) => ({
      user_id: v.user_id,
      created_at: v.created_at,
      profile: v.profile as unknown as {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
      } | null,
    })),
  };
}

// ---- Ideas V2 queries ----

export async function getIdeaParticipants(ideaId: string): Promise<IdeaParticipantWithUser[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_participants")
    .select("*, user:user_id(id, username, full_name, avatar_url)")
    .eq("idea_id", ideaId)
    .order("created_at", {ascending: true});
  return (data ?? []) as unknown as IdeaParticipantWithUser[];
}

export async function getIdeaAcceptedParticipants(ideaId: string): Promise<IdeaParticipantWithUser[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_participants")
    .select("*, user:user_id(id, username, full_name, avatar_url)")
    .eq("idea_id", ideaId)
    .eq("status", "accepted")
    .order("created_at", {ascending: true});
  return (data ?? []) as unknown as IdeaParticipantWithUser[];
}

export async function getIdeaMessages(ideaId: string): Promise<IdeaMessageWithSender[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_messages")
    .select("*, sender:sender_id(id, username, full_name, avatar_url)")
    .eq("idea_id", ideaId)
    .order("created_at", {ascending: true});
  return (data ?? []) as unknown as IdeaMessageWithSender[];
}

export async function getIdeaUserParticipation(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_participants")
    .select("id, status, message")
    .eq("idea_id", ideaId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as {id: string; status: string; message: string | null} | null;
}

export async function getIdeaUserSupport(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_supporters")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function isUserAcceptedParticipant(ideaId: string, userId: string, authorId: string): Promise<boolean> {
  if (userId === authorId) return true;
  const supabase = await createClient();
  const {data} = await supabase
    .from("idea_participants")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  return !!data;
}

export async function getIdeaSupportersCount(ideaId: string): Promise<number> {
  const supabase = await createClient();
  const {count} = await supabase
    .from("idea_supporters")
    .select("id", {count: "exact", head: true})
    .eq("idea_id", ideaId);
  return count ?? 0;
}
