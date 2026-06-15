import {createClient} from "@/lib/supabase/server";
import type {CommunityCreditRow, CommunityRole, ProfileRow} from "@/types/database";

export const adminCreditPointOptions = [5, 10, 25, 50, 100] as const;
export const adminCreditReasons = [
  "helpedCommunity",
  "sharedValuableMemory",
  "proposedUsefulIdea",
  "volunteerWork",
  "cityImprovementAction",
  "other",
] as const;

export type AdminCreditReason = (typeof adminCreditReasons)[number];
export type AdminContentType = "post" | "idea" | "memory";

export interface AdminUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: CommunityRole;
  contribution_score: number;
  created_at: string;
}

export interface AdminCredit extends CommunityCreditRow {
  user: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
  awarder: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
}

export interface AdminContentItem {
  id: string;
  type: AdminContentType;
  title: string;
  body: string | null;
  created_at: string;
  author: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
  viewHref: string;
}

export interface AdminPulseItem {
  type: AdminContentType | "member";
  title: string;
  subtitle: string | null;
  metric: string;
  href: string;
  author: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
}

export interface AdminActivityItem {
  id: string;
  type: "post" | "idea" | "memory" | "credit" | "member";
  title: string;
  subtitle: string | null;
  created_at: string;
  actor: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
  href: string;
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

export async function getCurrentAdminProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (!user) return null;

  const {data: profile} = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile as ProfileRow;
}

export async function getAdminOverview() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    {count: totalUsers},
    {count: totalPosts},
    {count: totalIdeas},
    {count: totalMemories},
    {count: postComments},
    {count: ideaComments},
    {count: memoryComments},
    {count: newMembersToday},
    {count: postsToday},
    {count: ideasToday},
    {count: memoriesToday},
    postAuthorsToday,
    ideaAuthorsToday,
    memoryContributorsToday,
    commentAuthorsToday,
    ideaCommentAuthorsToday,
    memoryCommentAuthorsToday,
  ] = await Promise.all([
    supabase.from("profiles").select("*", {count: "exact", head: true}),
    supabase.from("posts").select("*", {count: "exact", head: true}),
    supabase.from("ideas").select("*", {count: "exact", head: true}),
    supabase.from("memories").select("*", {count: "exact", head: true}),
    supabase.from("comments").select("*", {count: "exact", head: true}),
    supabase.from("idea_comments").select("*", {count: "exact", head: true}),
    supabase.from("memory_comments").select("*", {count: "exact", head: true}),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("posts").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("ideas").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("memories").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("posts").select("author_id").gte("created_at", todayIso),
    supabase.from("ideas").select("author_id").gte("created_at", todayIso),
    supabase.from("memories").select("contributor_id").gte("created_at", todayIso),
    supabase.from("comments").select("author_id").gte("created_at", todayIso),
    supabase.from("idea_comments").select("author_id").gte("created_at", todayIso),
    supabase.from("memory_comments").select("author_id").gte("created_at", todayIso),
  ]);

  const activeUserIds = new Set<string>();
  for (const row of postAuthorsToday.data ?? []) if (row.author_id) activeUserIds.add(row.author_id);
  for (const row of ideaAuthorsToday.data ?? []) if (row.author_id) activeUserIds.add(row.author_id);
  for (const row of memoryContributorsToday.data ?? []) if (row.contributor_id) activeUserIds.add(row.contributor_id);
  for (const row of commentAuthorsToday.data ?? []) if (row.author_id) activeUserIds.add(row.author_id);
  for (const row of ideaCommentAuthorsToday.data ?? []) if (row.author_id) activeUserIds.add(row.author_id);
  for (const row of memoryCommentAuthorsToday.data ?? []) if (row.author_id) activeUserIds.add(row.author_id);

  return {
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    totalIdeas: totalIdeas ?? 0,
    totalMemories: totalMemories ?? 0,
    totalComments: (postComments ?? 0) + (ideaComments ?? 0) + (memoryComments ?? 0),
    activeToday: activeUserIds.size,
    newMembersToday: newMembersToday ?? 0,
    postsToday: postsToday ?? 0,
    ideasToday: ideasToday ?? 0,
    memoriesToday: memoriesToday ?? 0,
  };
}

export async function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, contribution_score, created_at")
    .order("created_at", {ascending: false})
    .limit(40);

  if (safeSearch) {
    query = query.or(`username.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
  }

  const {data, error} = await query;

  if (!error) {
    return (data ?? []) as AdminUser[];
  }

  let fallbackQuery = supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, created_at")
    .order("created_at", {ascending: false})
    .limit(40);

  if (safeSearch) {
    fallbackQuery = fallbackQuery.or(`username.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
  }

  const {data: fallbackData} = await fallbackQuery;
  return (fallbackData ?? []).map((user) => ({
    ...user,
    contribution_score: 0,
  })) as AdminUser[];
}

export async function getRecentAdminCredits(limit = 12): Promise<AdminCredit[]> {
  const supabase = await createClient();
  const {data: credits} = await supabase
    .from("community_credits")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(limit);

  const rows = (credits ?? []) as CommunityCreditRow[];
  const profileIds = Array.from(new Set(rows.flatMap((credit) => [credit.user_id, credit.awarded_by].filter(Boolean) as string[])));

  if (profileIds.length === 0) {
    return rows.map((credit) => ({...credit, user: null, awarder: null}));
  }

  const {data: profiles} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .in("id", profileIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile as Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url">,
    ]),
  );

  return rows.map((credit) => ({
    ...credit,
    user: profileMap.get(credit.user_id) ?? null,
    awarder: credit.awarded_by ? profileMap.get(credit.awarded_by) ?? null : null,
  }));
}

export async function getTopContributors(limit = 6): Promise<AdminUser[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, contribution_score, created_at")
    .order("contribution_score", {ascending: false})
    .order("created_at", {ascending: true})
    .limit(limit);

  if (!error) {
    return (data ?? []) as AdminUser[];
  }

  const {data: fallbackData} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, created_at")
    .order("created_at", {ascending: true})
    .limit(limit);

  return (fallbackData ?? []).map((user) => ({
    ...user,
    contribution_score: 0,
  })) as AdminUser[];
}

export async function getNewestMembers(limit = 4): Promise<AdminUser[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, contribution_score, created_at")
    .order("created_at", {ascending: false})
    .limit(limit);

  if (!error) {
    return (data ?? []) as AdminUser[];
  }

  const {data: fallbackData} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, created_at")
    .order("created_at", {ascending: false})
    .limit(limit);

  return (fallbackData ?? []).map((user) => ({
    ...user,
    contribution_score: 0,
  })) as AdminUser[];
}

export async function getAdminPulse(): Promise<AdminPulseItem[]> {
  const supabase = await createClient();
  const [postResult, ideaResult, memoryResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, content, comments_count, created_at, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)")
      .order("comments_count", {ascending: false})
      .order("created_at", {ascending: false})
      .limit(1),
    supabase
      .from("ideas")
      .select("id, title, description, votes_count, created_at, author:profiles!ideas_author_id_fkey(id, full_name, username, avatar_url)")
      .order("votes_count", {ascending: false})
      .order("created_at", {ascending: false})
      .limit(1),
    supabase
      .from("memories")
      .select("id, title, description, created_at, contributor:profiles!memories_contributor_id_fkey(id, full_name, username, avatar_url)")
      .order("created_at", {ascending: false})
      .limit(1),
  ]);

  const pulse: AdminPulseItem[] = [];
  const post = postResult.data?.[0];
  if (post) {
    pulse.push({
      type: "post",
      title: post.title ?? post.content.slice(0, 80),
      subtitle: post.content,
      metric: String(post.comments_count ?? 0),
      href: "/feed",
      author: singleProfile(post.author),
    });
  }

  const idea = ideaResult.data?.[0];
  if (idea) {
    pulse.push({
      type: "idea",
      title: idea.title,
      subtitle: idea.description,
      metric: String(idea.votes_count ?? 0),
      href: "/ideas",
      author: singleProfile(idea.author),
    });
  }

  const memory = memoryResult.data?.[0];
  if (memory) {
    pulse.push({
      type: "memory",
      title: memory.title,
      subtitle: memory.description,
      metric: "—",
      href: `/memory/${memory.id}`,
      author: singleProfile(memory.contributor),
    });
  }

  return pulse;
}

export async function getRecentAdminContent(): Promise<AdminContentItem[]> {
  const supabase = await createClient();

  const [postsResult, ideasResult, memoriesResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, content, created_at, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)")
      .order("created_at", {ascending: false})
      .limit(6),
    supabase
      .from("ideas")
      .select("id, title, description, created_at, author:profiles!ideas_author_id_fkey(id, full_name, username, avatar_url)")
      .order("created_at", {ascending: false})
      .limit(6),
    supabase
      .from("memories")
      .select("id, title, description, created_at, contributor:profiles!memories_contributor_id_fkey(id, full_name, username, avatar_url)")
      .order("created_at", {ascending: false})
      .limit(6),
  ]);

  const posts: AdminContentItem[] = (postsResult.data ?? []).map((post) => ({
    id: post.id,
    type: "post" as const,
    title: post.title ?? post.content.slice(0, 80),
    body: post.content,
    created_at: post.created_at,
    author: singleProfile(post.author),
    viewHref: "/feed",
  }));

  const ideas: AdminContentItem[] = (ideasResult.data ?? []).map((idea) => ({
    id: idea.id,
    type: "idea" as const,
    title: idea.title,
    body: idea.description,
    created_at: idea.created_at,
    author: singleProfile(idea.author),
    viewHref: "/ideas",
  }));

  const memories: AdminContentItem[] = (memoriesResult.data ?? []).map((memory) => ({
    id: memory.id,
    type: "memory" as const,
    title: memory.title,
    body: memory.description,
    created_at: memory.created_at,
    author: singleProfile(memory.contributor),
    viewHref: `/memory/${memory.id}`,
  }));

  return [...posts, ...ideas, ...memories]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12);
}

export async function getRecentAdminActivity(): Promise<AdminActivityItem[]> {
  const [content, credits, newestMembers] = await Promise.all([
    getRecentAdminContent(),
    getRecentAdminCredits(5),
    getNewestMembers(5),
  ]);

  const contentItems: AdminActivityItem[] = content.slice(0, 7).map((item) => ({
    id: `${item.type}-${item.id}`,
    type: item.type,
    title: item.title,
    subtitle: item.body,
    created_at: item.created_at,
    actor: item.author,
    href: item.viewHref,
  }));

  const creditItems: AdminActivityItem[] = credits.map((credit) => ({
    id: `credit-${credit.id}`,
    type: "credit",
    title: `+${credit.points}`,
    subtitle: credit.reason,
    created_at: credit.created_at,
    actor: credit.user,
    href: "/admin/credits",
  }));

  const memberItems: AdminActivityItem[] = newestMembers.map((member) => ({
    id: `member-${member.id}`,
    type: "member",
    title: member.full_name ?? member.username ?? "Member",
    subtitle: member.username ? `@${member.username}` : null,
    created_at: member.created_at,
    actor: member,
    href: "/admin/users",
  }));

  return [...contentItems, ...creditItems, ...memberItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12);
}
