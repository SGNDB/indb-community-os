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
  language_preference?: string;
  last_login?: string | null;
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
  type: "post" | "idea" | "memory" | "credit" | "member" | "graatek" | "donation" | "volunteer";
  title: string;
  subtitle: string | null;
  created_at: string;
  actor: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
  href: string;
}

export interface AdminDashboardKPI {
  label: string;
  value: number;
  icon: string;
  change?: number;
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

export async function getAdminDashboardKPIs(): Promise<AdminDashboardKPI[]> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    {count: totalUsers},
    {count: ideasInProgress},
    {count: activeGraatek},
    {count: activeCampaigns},
    {count: messagesToday},
    {count: activeVolunteers},
    {count: donationsThisMonth},
    {count: activeUsersToday},
  ] = await Promise.all([
    supabase.from("profiles").select("*", {count: "exact", head: true}),
    supabase.from("ideas").select("*", {count: "exact", head: true}).in("status", ["published", "interested", "discussion", "in_progress"]),
    supabase.from("community_shares").select("*", {count: "exact", head: true}).eq("status", "active"),
    supabase.from("support_campaigns").select("*", {count: "exact", head: true}).eq("status", "active"),
    supabase.from("conversation_messages").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("last_login", todayIso),
    supabase.from("support_contributions").select("*", {count: "exact", head: true}).eq("contribution_type", "money").gte("created_at", monthStart),
    supabase.from("profiles").select("id", {count: "exact", head: true}).gte("last_login", todayIso),
  ]);

  return [
    {label: "totalUsers", value: totalUsers ?? 0, icon: "Users", href: "/admin/users"},
    {label: "activeUsersToday", value: activeUsersToday ?? 0, icon: "Activity", href: "/admin/analytics"},
    {label: "activeIdeas", value: ideasInProgress ?? 0, icon: "Lightbulb", href: "/admin/ideas"},
    {label: "activeGraatek", value: activeGraatek ?? 0, icon: "Gift", href: "/admin/graatek"},
    {label: "activeCampaigns", value: activeCampaigns ?? 0, icon: "HandHeart", href: "/admin/support"},
    {label: "activeVolunteers", value: activeVolunteers ?? 0, icon: "UsersRound", href: "/admin/volunteer"},
    {label: "donationsThisMonth", value: donationsThisMonth ?? 0, icon: "Landmark", href: "/admin/payments"},
    {label: "messagesToday", value: messagesToday ?? 0, icon: "MessageCircle", href: "/admin/messages"},
  ];
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
    .select("id, full_name, username, avatar_url, role, contribution_score, created_at, language_preference")
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
    .select("id, full_name, username, avatar_url, role, created_at, language_preference")
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

export async function getAdminUserById(userId: string) {
  const supabase = await createClient();
  const {data: profile} = await supabase
    .from("profiles")
    .select("*, posts:posts(count), ideas:ideas(count), memories:memories(count), comments:comments(count)")
    .eq("id", userId)
    .single();
  return profile;
}

export async function getAdminIdeas(search?: string) {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("ideas")
    .select("id, title, description, status, votes_count, created_at, author:profiles!ideas_author_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(50);

  if (safeSearch) {
    query = query.ilike("title", `%${safeSearch}%`);
  }

  const {data} = await query;
  return (data ?? []).map((idea) => ({
    ...idea,
    author: singleProfile(idea.author),
  }));
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

export async function getAdminSupportCampaigns() {
  const supabase = await createClient();
  const {data: campaigns} = await supabase
    .from("support_campaigns")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(20);
  return campaigns ?? [];
}

export async function getAdminDonations() {
  const supabase = await createClient();
  const {data} = await supabase
    .from("support_contributions")
    .select("*, contributor:profiles(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(30);
  return (data ?? []).map((d) => ({
    ...d,
    contributor: singleProfile(d.contributor),
  }));
}

export async function getAdminVolunteerOpportunities() {
  const supabase = await createClient();
  const {data} = await supabase
    .from("support_campaigns")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(20);
  return data ?? [];
}

export async function getAdminReportedContent() {
  const supabase = await createClient();
  const {data: reports} = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(30);
  return (reports ?? []).map((r) => ({
    ...r,
    reporter: singleProfile(r.reporter),
  }));
}

export interface AdminUserGrowthPoint {
  month: string;
  value: number;
}

export interface AdminActivityPoint {
  date: string;
  posts: number;
  ideas: number;
  memories: number;
}

export interface AdminDonationByCampaign {
  campaignId: string;
  campaignTitle: string;
  totalAmount: number;
  count: number;
}

export interface AdminVolunteerMonth {
  month: string;
  value: number;
}

export async function getAdminUserGrowth(): Promise<AdminUserGrowthPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminUserGrowthPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {count} = await supabase
      .from("profiles")
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

export async function getAdminCommunityActivity(): Promise<AdminActivityPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminActivityPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const start = d.toISOString().slice(0, 10);
    const end = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);

    const [{count: posts}, {count: ideas}, {count: memories}] = await Promise.all([
      supabase.from("posts").select("*", {count: "exact", head: true}).gte("created_at", start).lt("created_at", end),
      supabase.from("ideas").select("*", {count: "exact", head: true}).gte("created_at", start).lt("created_at", end),
      supabase.from("memories").select("*", {count: "exact", head: true}).gte("created_at", start).lt("created_at", end),
    ]);

    points.push({
      date: d.toLocaleDateString("en-US", {month: "short", day: "numeric"}),
      posts: posts ?? 0,
      ideas: ideas ?? 0,
      memories: memories ?? 0,
    });
  }

  return points;
}

export async function getAdminDonationsByCampaign(): Promise<AdminDonationByCampaign[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("support_contributions")
    .select("campaign_id, amount, campaign:campaign_id(id, title)")
    .eq("contribution_type", "money")
    .not("amount", "is", null);

  const grouped = new Map<string, {title: string; total: number; count: number}>();
  for (const row of data ?? []) {
    const cId = row.campaign_id;
    const cTitle = (row.campaign as unknown as {title: string})?.title ?? "Unknown";
    if (!grouped.has(cId)) grouped.set(cId, {title: cTitle, total: 0, count: 0});
    const entry = grouped.get(cId)!;
    entry.total += Number(row.amount ?? 0);
    entry.count += 1;
  }

  return Array.from(grouped.entries())
    .map(([campaignId, {title, total, count}]) => ({campaignId, campaignTitle: title, totalAmount: total, count}))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function getAdminVolunteerActivity(): Promise<AdminVolunteerMonth[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminVolunteerMonth[] = [];

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {count} = await supabase
      .from("support_contributions")
      .select("*", {count: "exact", head: true})
      .eq("contribution_type", "volunteer")
      .gte("created_at", start)
      .lt("created_at", end);
    points.push({
      month: m.toLocaleDateString("en-US", {month: "short", year: "2-digit"}),
      value: count ?? 0,
    });
  }

  return points;
}

export async function getAdminRecentActivity(): Promise<AdminActivityItem[]> {
  const supabase = await createClient();
  const recent: AdminActivityItem[] = [];

  const {data: newProfiles} = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, created_at")
    .order("created_at", {ascending: false})
    .limit(5);

  for (const p of newProfiles ?? []) {
    recent.push({
      id: `member-${p.id}`,
      type: "member",
      title: p.full_name ?? p.username ?? "New Member",
      subtitle: "New registration",
      created_at: p.created_at,
      actor: p as Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url">,
      href: `/admin/users?search=${p.id}`,
    });
  }

  const {data: newIdeas} = await supabase
    .from("ideas")
    .select("id, title, created_at, author:profiles!ideas_author_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(5);

  for (const idea of newIdeas ?? []) {
    recent.push({
      id: `idea-${idea.id}`,
      type: "idea",
      title: idea.title,
      subtitle: "New idea submitted",
      created_at: idea.created_at,
      actor: singleProfile(idea.author),
      href: `/admin/ideas`,
    });
  }

  const {data: newGraatek} = await supabase
    .from("community_shares")
    .select("id, title, created_at, owner:profiles!community_shares_owner_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(5);

  for (const g of newGraatek ?? []) {
    recent.push({
      id: `graatek-${g.id}`,
      type: "graatek",
      title: g.title,
      subtitle: "New Graatek created",
      created_at: g.created_at,
      actor: singleProfile(g.owner),
      href: `/admin/graatek`,
    });
  }

  const {data: donations} = await supabase
    .from("support_contributions")
    .select("id, amount, created_at, contributor:profiles(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(5);

  for (const d of donations ?? []) {
    recent.push({
      id: `donation-${d.id}`,
      type: "donation",
      title: `${Number(d.amount).toLocaleString()} MRU`,
      subtitle: "Donation received",
      created_at: d.created_at,
      actor: singleProfile(d.contributor),
      href: `/admin/donations`,
    });
  }

  return recent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
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

export interface AdminDonationTrend {
  month: string;
  value: number;
}

export async function getAdminDonationTrend(): Promise<AdminDonationTrend[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminDonationTrend[] = [];

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {data} = await supabase
      .from("support_contributions")
      .select("amount")
      .eq("contribution_type", "money")
      .not("amount", "is", null)
      .gte("created_at", start)
      .lt("created_at", end);
    const total = (data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    points.push({
      month: m.toLocaleDateString("en-US", {month: "short", year: "2-digit"}),
      value: total,
    });
  }

  return points;
}

export interface AdminConversationTrend {
  date: string;
  value: number;
}

export async function getAdminConversationTrend(): Promise<AdminConversationTrend[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminConversationTrend[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const start = d.toISOString().slice(0, 10);
    const end = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
    const {count} = await supabase
      .from("conversation_messages")
      .select("*", {count: "exact", head: true})
      .gte("created_at", start)
      .lt("created_at", end);
    points.push({
      date: d.toLocaleDateString("en-US", {month: "short", day: "numeric"}),
      value: count ?? 0,
    });
  }

  return points;
}

export interface AdminPaymentMethod {
  method: string;
  count: number;
  total: number;
}

export async function getAdminPaymentMethods(): Promise<AdminPaymentMethod[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("support_contributions")
    .select("payment_method, amount")
    .eq("contribution_type", "money")
    .not("amount", "is", null);

  const grouped = new Map<string, {count: number; total: number}>();
  for (const row of data ?? []) {
    const method = row.payment_method || "other";
    if (!grouped.has(method)) grouped.set(method, {count: 0, total: 0});
    const entry = grouped.get(method)!;
    entry.count += 1;
    entry.total += Number(row.amount ?? 0);
  }

  return Array.from(grouped.entries())
    .map(([method, {count, total}]) => ({method, count, total}))
    .sort((a, b) => b.total - a.total);
}

export interface AdminHourlyPoint {
  hour: string;
  value: number;
}

export async function getAdminHourlyActivity(): Promise<AdminHourlyPoint[]> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const points: AdminHourlyPoint[] = [];

  for (let h = 0; h < 24; h++) {
    const hStart = new Date(today.getTime() + h * 3600000).toISOString();
    const hEnd = new Date(today.getTime() + (h + 1) * 3600000).toISOString();
    const {count} = await supabase
      .from("conversation_messages")
      .select("*", {count: "exact", head: true})
      .gte("created_at", hStart)
      .lt("created_at", hEnd);
    points.push({
      hour: `${h.toString().padStart(2, "0")}:00`,
      value: count ?? 0,
    });
  }

  return points;
}

export interface AdminVolunteerStats {
  totalHours: number;
  completedActivities: number;
  growth: AdminVolunteerMonth[];
}

export interface AdminPayment {
  id: string;
  amount: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  contributor: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null;
  campaign: {id: string; title: string} | null;
}

export async function getAdminPayments(search?: string): Promise<AdminPayment[]> {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("support_contributions")
    .select("id, amount, payment_method, payment_status, created_at, contributor:profiles(id, full_name, username, avatar_url), campaign:campaign_id(id, title)")
    .eq("contribution_type", "money")
    .order("created_at", {ascending: false})
    .limit(40);

  if (safeSearch) {
    query = query.or(`payment_method.ilike.%${safeSearch}%,payment_status.ilike.%${safeSearch}%`);
  }

  const {data} = await query;
  return (data ?? []).map((d) => ({
    ...d,
    contributor: singleProfile(d.contributor),
    campaign: (d.campaign as unknown as {id: string; title: string} | null) ?? null,
  })) as AdminPayment[];
}

export interface AdminRealtimeActivity {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

export async function getAdminRealtimeActivity(): Promise<AdminRealtimeActivity[]> {
  const supabase = await createClient();
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60000).toISOString();
  const items: AdminRealtimeActivity[] = [];

  const [{data: messages}, {data: donations}, {data: newProfiles}] = await Promise.all([
    supabase.from("conversation_messages").select("id, content, created_at").gte("created_at", fiveMinsAgo).limit(10),
    supabase.from("support_contributions").select("id, amount, created_at").eq("contribution_type", "money").gte("created_at", fiveMinsAgo).limit(5),
    supabase.from("profiles").select("id, full_name, username, created_at").gte("created_at", fiveMinsAgo).limit(5),
  ]);

  for (const msg of messages ?? []) {
    items.push({id: `msg-${msg.id}`, type: "message", title: msg.content?.slice(0, 80) ?? "New message", created_at: msg.created_at});
  }
  for (const d of donations ?? []) {
    items.push({id: `donation-${d.id}`, type: "donation", title: `${Number(d.amount).toLocaleString()} MRU donation`, created_at: d.created_at});
  }
  for (const p of newProfiles ?? []) {
    items.push({id: `member-${p.id}`, type: "member", title: `${p.full_name ?? p.username ?? "Someone"} joined`, created_at: p.created_at});
  }

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
}

export async function getAdminIdeaGrowth(): Promise<AdminUserGrowthPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const points: AdminUserGrowthPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {count} = await supabase
      .from("ideas")
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

export interface AdminHealthIndicators {
  dau: number;
  mau: number;
  newMembersToday: number;
  postsToday: number;
  ideasToday: number;
  memoriesToday: number;
  totalComments: number;
  engagementRate: number;
  growthRate: number;
}

export async function getAdminHealthIndicators(): Promise<AdminHealthIndicators> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const monthAgo = new Date(today.getTime() - 30 * 86400000).toISOString();

  const [
    {count: dau},
    {count: mau},
    {count: newMembersToday},
    {count: postsToday},
    {count: ideasToday},
    {count: memoriesToday},
    {count: postComments},
    {count: ideaComments},
    {count: memoryComments},
    {count: totalUsers},
  ] = await Promise.all([
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("last_login", todayIso),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("last_login", monthAgo),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("posts").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("ideas").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("memories").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("comments").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("idea_comments").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("memory_comments").select("*", {count: "exact", head: true}).gte("created_at", todayIso),
    supabase.from("profiles").select("*", {count: "exact", head: true}),
  ]);

  const totalComments = (postComments ?? 0) + (ideaComments ?? 0) + (memoryComments ?? 0);
  const total = totalUsers ?? 1;

  return {
    dau: dau ?? 0,
    mau: mau ?? 0,
    newMembersToday: newMembersToday ?? 0,
    postsToday: postsToday ?? 0,
    ideasToday: ideasToday ?? 0,
    memoriesToday: memoriesToday ?? 0,
    totalComments,
    engagementRate: Math.round(((dau ?? 0) / total) * 100),
    growthRate: 0,
  };
}

/* ───────────────────────────────────────────────
   Users Management Page
   ─────────────────────────────────────────────── */

export interface AdminUserWithStats extends AdminUser {
  phone: string | null;
  last_login: string | null;
  is_verified: boolean;
  posts_count: number;
  ideas_count: number;
  memories_count: number;
  graatek_count: number;
  donations_total: number;
  donations_count: number;
  volunteer_hours: number;
  volunteer_activities: number;
  impact_score: number;
  badges: string[];
}

export interface AdminUserTimelineItem {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

export interface AdminUsersKPISummary {
  totalUsers: number;
  activeToday: number;
  newThisMonth: number;
  verifiedUsers: number;
  languageDistribution: {language: string; count: number}[];
  monthlyGrowth: AdminUserGrowthPoint[];
  dailyGrowth: AdminUserGrowthPoint[];
}

export interface AdminTopContributor {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  contribution_score: number;
  category: string;
  metric: number;
}

export function computeImpactScore(stats: {
  posts_count: number;
  ideas_count: number;
  memories_count: number;
  graatek_count: number;
  donations_total: number;
  volunteer_hours: number;
}): {score: number; badges: string[]} {
  const weights = {
    posts: 1,
    ideas: 3,
    memories: 2,
    graatek: 2,
    donations: 4,
    volunteer: 3,
  };
  const raw =
    stats.posts_count * weights.posts +
    stats.ideas_count * weights.ideas +
    stats.memories_count * weights.memories +
    stats.graatek_count * weights.graatek +
    Math.min(stats.donations_total / 1000, 50) * weights.donations +
    Math.min(stats.volunteer_hours, 100) * weights.volunteer;
  const score = Math.min(Math.round((raw / 200) * 100), 100);
  const badges: string[] = [];
  if (score >= 80) badges.push("community_leader");
  if (stats.ideas_count >= 5) badges.push("innovator");
  if (stats.memories_count >= 10) badges.push("historian");
  if (stats.graatek_count >= 5) badges.push("contributor");
  if (stats.donations_total > 0) badges.push("supporter");
  if (stats.volunteer_hours > 0) badges.push("volunteer");
  return {score, badges};
}

export async function getAdminUsersWithStats(
  search?: string,
  filters?: {language?: string; status?: string; verified?: string; donor?: string; volunteer?: string; ideaCreator?: string; graatekContributor?: string},
): Promise<AdminUserWithStats[]> {
  const supabase = await createClient();
  const safeSearch = sanitizeSearchTerm(search);

  let query = supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role, contribution_score, created_at, language_preference, last_login, phone, phone_verified")
    .order("created_at", {ascending: false})
    .limit(40);

  if (safeSearch) {
    query = query.or(`username.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  }

  const {data: profiles, error} = await query;
  if (error) return [];
  const typedProfiles = (profiles ?? []) as (ProfileRow & {phone: string | null; last_login: string | null; phone_verified: boolean | null})[];
  if (typedProfiles.length === 0) return [];

  const userIds = typedProfiles.map((p) => p.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [postsRes, ideasRes, memoriesRes, graatekRes, donationsRes, volunteersRes] = await Promise.all([
    supabase.from("posts").select("author_id").in("author_id", userIds),
    supabase.from("ideas").select("author_id").in("author_id", userIds),
    supabase.from("memories").select("contributor_id").in("contributor_id", userIds),
    supabase.from("community_shares").select("owner_id").in("owner_id", userIds),
    supabase.from("support_contributions").select("contributor_id, amount").eq("contribution_type", "money").in("contributor_id", userIds),
    supabase.from("support_campaigns").select("id, creator_id").in("creator_id", userIds).gte("created_at", monthStart),
  ]);
  const posts = postsRes.data;
  const ideas = ideasRes.data;
  const memories = memoriesRes.data;
  const graatek = graatekRes.data;
  const donations = donationsRes.data;
  const volunteers = volunteersRes.data;

  const postCounts = new Map<string, number>();
  for (const r of posts ?? []) postCounts.set(r.author_id, (postCounts.get(r.author_id) ?? 0) + 1);

  const ideaCounts = new Map<string, number>();
  for (const r of ideas ?? []) ideaCounts.set(r.author_id, (ideaCounts.get(r.author_id) ?? 0) + 1);

  const memoryCounts = new Map<string, number>();
  for (const r of memories ?? []) memoryCounts.set(r.contributor_id, (memoryCounts.get(r.contributor_id) ?? 0) + 1);

  const graatekCounts = new Map<string, number>();
  for (const r of graatek ?? []) graatekCounts.set(r.owner_id, (graatekCounts.get(r.owner_id) ?? 0) + 1);

  const donationTotals = new Map<string, {total: number; count: number}>();
  for (const r of donations ?? []) {
    const prev = donationTotals.get(r.contributor_id) ?? {total: 0, count: 0};
    donationTotals.set(r.contributor_id, {total: prev.total + Number(r.amount ?? 0), count: prev.count + 1});
  }

  const volunteerCounts = new Map<string, number>();
  for (const r of volunteers ?? []) volunteerCounts.set(r.creator_id, (volunteerCounts.get(r.creator_id) ?? 0) + 1);

  return typedProfiles.map((profile) => {
    const stats = {
      posts_count: postCounts.get(profile.id) ?? 0,
      ideas_count: ideaCounts.get(profile.id) ?? 0,
      memories_count: memoryCounts.get(profile.id) ?? 0,
      graatek_count: graatekCounts.get(profile.id) ?? 0,
      donations_total: donationTotals.get(profile.id)?.total ?? 0,
      donations_count: donationTotals.get(profile.id)?.count ?? 0,
      volunteer_hours: 0,
      volunteer_activities: volunteerCounts.get(profile.id) ?? 0,
    };
    const {score, badges} = computeImpactScore(stats);
    return {
      id: profile.id,
      full_name: profile.full_name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role,
      contribution_score: profile.contribution_score ?? 0,
      created_at: profile.created_at,
      language_preference: profile.language_preference,
      phone: profile.phone,
      last_login: profile.last_login,
      is_verified: profile.phone_verified ?? false,
      ...stats,
      impact_score: score,
      badges,
    };
  }).filter((u) => {
    if (filters?.language && u.language_preference !== filters.language) return false;
    if (filters?.status === "active" && (!u.last_login || new Date(u.last_login) < new Date(Date.now() - 7 * 86400000))) return false;
    if (filters?.status === "inactive" && u.last_login && new Date(u.last_login) >= new Date(Date.now() - 7 * 86400000)) return false;
    if (filters?.status === "suspended") return false;
    if (filters?.verified === "true" && !u.is_verified) return false;
    if (filters?.verified === "false" && u.is_verified) return false;
    if (filters?.donor === "true" && u.donations_total === 0) return false;
    if (filters?.volunteer === "true" && u.volunteer_activities === 0) return false;
    if (filters?.ideaCreator === "true" && u.ideas_count === 0) return false;
    if (filters?.graatekContributor === "true" && u.graatek_count === 0) return false;
    return true;
  });
}

export async function getAdminUserProfile(userId: string) {
  const supabase = await createClient();
  const {data: profile} = await supabase
    .from("profiles")
    .select("*, posts:posts(count), ideas:ideas(count), memories:memories(count), comments:comments(count)")
    .eq("id", userId)
    .single();
  return profile;
}

export async function getAdminUserTimeline(userId: string, limit = 20): Promise<AdminUserTimelineItem[]> {
  const supabase = await createClient();
  const items: AdminUserTimelineItem[] = [];

  const [{data: posts}, {data: ideas}, {data: memories}, {data: graatek}, {data: donations}, {data: credits}] = await Promise.all([
    supabase.from("posts").select("id, title, created_at").eq("author_id", userId).order("created_at", {ascending: false}).limit(limit),
    supabase.from("ideas").select("id, title, created_at").eq("author_id", userId).order("created_at", {ascending: false}).limit(limit),
    supabase.from("memories").select("id, title, created_at").eq("contributor_id", userId).order("created_at", {ascending: false}).limit(limit),
    supabase.from("community_shares").select("id, title, created_at").eq("owner_id", userId).order("created_at", {ascending: false}).limit(limit),
    supabase.from("support_contributions").select("id, amount, created_at").eq("contributor_id", userId).eq("contribution_type", "money").order("created_at", {ascending: false}).limit(limit),
    supabase.from("community_credits").select("id, points, reason, created_at").eq("user_id", userId).order("created_at", {ascending: false}).limit(limit),
  ]);

  for (const p of posts ?? []) items.push({id: `post-${p.id}`, type: "post", title: p.title ?? "Posted", created_at: p.created_at});
  for (const i of ideas ?? []) items.push({id: `idea-${i.id}`, type: "idea", title: i.title ?? "Created Idea", created_at: i.created_at});
  for (const m of memories ?? []) items.push({id: `memory-${m.id}`, type: "memory", title: m.title ?? "Shared Memory", created_at: m.created_at});
  for (const g of graatek ?? []) items.push({id: `graatek-${g.id}`, type: "graatek", title: g.title ?? "Shared Item", created_at: g.created_at});
  for (const d of donations ?? []) items.push({id: `donation-${d.id}`, type: "donation", title: `${Number(d.amount).toLocaleString()} MRU donation`, created_at: d.created_at});
  for (const c of credits ?? []) items.push({id: `credit-${c.id}`, type: "credit", title: `+${c.points} pts — ${c.reason}`, created_at: c.created_at});

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
}

export async function getAdminUsersKPISummary(): Promise<AdminUsersKPISummary> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const langLabels: Record<string, string> = {ar: "Arabic", fr: "French", en: "English"};

  const [{count: totalUsers}, {count: activeToday}, {count: newThisMonth}, {count: verified}, {data: langData}] = await Promise.all([
    supabase.from("profiles").select("*", {count: "exact", head: true}),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("last_login", todayIso),
    supabase.from("profiles").select("*", {count: "exact", head: true}).gte("created_at", monthStart),
    supabase.from("profiles").select("*", {count: "exact", head: true}).eq("phone_verified", true),
    supabase.from("profiles").select("language_preference"),
  ]);

  const langCount = new Map<string, number>();
  for (const r of langData ?? []) {
    const lang = r.language_preference || "en";
    langCount.set(lang, (langCount.get(lang) ?? 0) + 1);
  }
  const languageDistribution = Array.from(langCount.entries())
    .map(([language, count]) => ({language: langLabels[language] ?? language, count}))
    .sort((a, b) => b.count - a.count);

  const now = new Date();
  const monthlyGrowth: AdminUserGrowthPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = m.toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const {count} = await supabase
      .from("profiles")
      .select("*", {count: "exact", head: true})
      .gte("created_at", start)
      .lt("created_at", end);
    monthlyGrowth.push({month: m.toLocaleDateString("en-US", {month: "short", year: "2-digit"}), value: count ?? 0});
  }

  const dailyGrowth: AdminUserGrowthPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const start = d.toISOString().slice(0, 10);
    const end = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
    const {count} = await supabase
      .from("profiles")
      .select("*", {count: "exact", head: true})
      .gte("created_at", start)
      .lt("created_at", end);
    dailyGrowth.push({month: d.toLocaleDateString("en-US", {month: "short", day: "numeric"}), value: count ?? 0});
  }

  return {totalUsers: totalUsers ?? 0, activeToday: activeToday ?? 0, newThisMonth: newThisMonth ?? 0, verifiedUsers: verified ?? 0, languageDistribution, monthlyGrowth, dailyGrowth};
}

export async function getAdminTopContributors(category: string, limit = 10): Promise<AdminTopContributor[]> {
  const supabase = await createClient();
  if (category === "donations") {
    const {data} = await supabase
      .from("support_contributions")
      .select("contributor_id, amount, contributor:profiles!support_contributions_contributor_id_fkey(id, full_name, username, avatar_url)")
      .eq("contribution_type", "money")
      .not("contributor_id", "is", null)
      .order("amount", {ascending: false})
      .limit(limit);
    const grouped = new Map<string, {profile: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null; total: number}>();
    for (const r of data ?? []) {
      const id = r.contributor_id;
      const prev = grouped.get(id) ?? {profile: singleProfile(r.contributor), total: 0};
      grouped.set(id, {profile: prev.profile, total: prev.total + Number(r.amount ?? 0)});
    }
    return Array.from(grouped.entries()).slice(0, limit).map(([id, {profile, total}]) => ({
      id, full_name: profile?.full_name ?? null, username: profile?.username ?? null, avatar_url: profile?.avatar_url ?? null, contribution_score: 0, category: "donations", metric: total,
    }));
  }
  if (category === "volunteers") {
    const {data} = await supabase.from("support_campaigns").select("creator_id, creator:profiles!support_campaigns_creator_id_fkey(id, full_name, username, avatar_url)").not("creator_id", "is", null).limit(limit);
    const grouped = new Map<string, {profile: Pick<ProfileRow, "id" | "full_name" | "username" | "avatar_url"> | null; count: number}>();
    for (const r of data ?? []) {
      const id = r.creator_id;
      const prev = grouped.get(id) ?? {profile: singleProfile(r.creator), count: 0};
      grouped.set(id, {profile: prev.profile, count: prev.count + 1});
    }
    return Array.from(grouped.entries()).slice(0, limit).map(([id, {profile, count}]) => ({
      id, full_name: profile?.full_name ?? null, username: profile?.username ?? null, avatar_url: profile?.avatar_url ?? null, contribution_score: 0, category: "volunteers", metric: count,
    }));
  }
  const {data} = await supabase.from("profiles").select("id, full_name, username, avatar_url, contribution_score").order("contribution_score", {ascending: false}).limit(limit);
  return (data ?? []).map((p) => ({...p, category, metric: p.contribution_score ?? 0}));
}
