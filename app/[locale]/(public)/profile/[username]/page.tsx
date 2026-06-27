import {Suspense} from "react";
import {CalendarDays, Heart, MapPin} from "lucide-react";
import type {Metadata} from "next";
import Image from "next/image";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {ProfileCompleteness} from "@/components/profile/profile-completeness";
import {ProfileTabsContent} from "@/components/profile/profile-tabs-content";
import {FollowSummary} from "@/components/profile/follow-summary";
import {CommunityImpactSection} from "@/components/profile/community-impact-section";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {getCommentsForPosts} from "@/lib/data/comments";
import {getContributionRankKey} from "@/lib/contribution";
import {getCommunityImpact} from "@/lib/data/community-impact";
import {getFullProfileDetails} from "@/lib/data/profile-details";
import {getFollowStats, isFollowing} from "@/lib/data/follows";
import {getUserPosts, getUserPostsCount} from "@/lib/data/posts";
import {getProfileByUsername} from "@/lib/data/profile";
import {getUserMemories, getUserMemoriesCount} from "@/lib/data/memories";
import {getUserIdeas, getUserIdeasCount} from "@/lib/data/ideas";
import {getUserCommunityShares} from "@/lib/data/fadla";
import {canViewProfile, getPublicProfilePrivacy} from "@/lib/data/user-settings";
import {Link} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; username: string}>;
}): Promise<Metadata> {
  const {username} = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {title: "Not Found"};

  return {
    title: profile.full_name ?? profile.username ?? "Profile",
    description: profile.bio ?? `Community profile of ${profile.username}`,
  };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function formatJoinDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
  });
}

async function ProfileTabsFetcher({
  profileId,
  locale,
  currentUserId,
  initialTab,
  profile,
  isOwnProfile,
  showMemories,
  showGraatek,
}: {
  profileId: string;
  locale: string;
  currentUserId: string | null;
  initialTab: string;
  profile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    bio: string | null;
    city: string | null;
    hometown: string | null;
    languages_spoken: string[];
    contribution_score: number;
    created_at: string;
  };
  isOwnProfile: boolean;
  showMemories: boolean;
  showGraatek: boolean;
}) {
  const [allPosts, memories, ideas, shares, profileDetails] = await Promise.all([
    getUserPosts(profileId, currentUserId),
    showMemories ? getUserMemories(profileId) : Promise.resolve([]),
    getUserIdeas(profileId),
    showGraatek ? getUserCommunityShares(profileId) : Promise.resolve([]),
    getFullProfileDetails(profileId),
  ]);

  const commentsByPost = allPosts.length > 0 ? await getCommentsForPosts(allPosts.map((p) => p.id)) : {};

  return (
    <>
      {isOwnProfile && (
        <ProfileCompleteness
          hasAvatar={!!profile.avatar_url}
          hasCover={!!profile.cover_image_url}
          hasBio={!!profile.bio}
          hasCity={!!profile.city}
          hasWork={profileDetails.work.length > 0}
          hasEducation={profileDetails.education.length > 0}
          hasInterests={profileDetails.interests.length > 0}
          hasLinks={profileDetails.links.length > 0}
        />
      )}
      <ProfileTabsContent
        locale={locale}
        currentUserId={currentUserId}
        allPosts={allPosts}
        memories={memories}
        ideas={ideas}
        shares={shares}
        commentsByPost={commentsByPost}
        profile={profile}
        profileDetails={profileDetails}
        isOwnProfile={isOwnProfile}
        initialTab={initialTab}
        showMemories={showMemories}
        showGraatek={showGraatek}
      />
    </>
  );
}

function ProfileTabsFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-full animate-pulse rounded-2xl bg-muted/50" />
      <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
    </div>
  );
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string; username: string}>;
  searchParams: Promise<{tab?: string}>;
}) {
  const {locale, username} = await params;
  const {tab: activeTab} = await searchParams;

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const isOwnProfile = currentUserId === profile.id;

  const [viewerCanAccess, privacy] = await Promise.all([
    canViewProfile(profile.id, currentUserId),
    getPublicProfilePrivacy(profile.id),
  ]);

  if (!viewerCanAccess) notFound();

  const showRecognition = isOwnProfile || privacy.show_community_recognition;
  const showVolunteerHours = isOwnProfile || privacy.show_volunteer_hours;
  const showGraatek = isOwnProfile || privacy.show_completed_graatek;
  const showMemories = isOwnProfile || privacy.show_memories;

  const [followStats, currentUserIsFollowing, postsCount, memoriesCount, ideasCount, impact] = await Promise.all([
    getFollowStats(profile.id),
    isFollowing(currentUserId, profile.id),
    getUserPostsCount(profile.id),
    showMemories ? getUserMemoriesCount(profile.id) : Promise.resolve(0),
    getUserIdeasCount(profile.id),
    showRecognition ? getCommunityImpact(profile.id) : Promise.resolve(null),
  ]);

  const {data: postIds} = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", profile.id);
  const {count: rawComments} = postIds?.length
    ? await supabase
        .from("comments")
        .select("*", {count: "exact", head: true})
        .in("post_id", postIds.map((p) => p.id))
        .eq("status", "published")
    : {count: 0};
  const commentsCount = rawComments ?? 0;

  const displayName = profile.full_name ?? profile.username ?? "?";
  const initials = getInitials(displayName);
  const joinDate = formatJoinDate(profile.created_at, locale);
  const contributionScore = profile.contribution_score ?? 0;
  const contributionRank = getContributionRankKey(contributionScore);
  const requestedTab = activeTab === "posts" ? "posts" : activeTab === "memories" ? "memories" : activeTab === "ideas" ? "ideas" : activeTab === "shares" ? "shares" : "about";
  const currentTab = (!showMemories && requestedTab === "memories") || (!showGraatek && requestedTab === "shares")
    ? "about"
    : requestedTab;

  const t = await getTranslations({locale, namespace: "Profile"});

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/70 shadow-[0_12px_32px_rgba(8,33,56,0.08)]">
        <div
          className="relative h-40 sm:h-56"
          style={
            profile.cover_image_url
              ? {backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center"}
              : {}
          }
        >
          {!profile.cover_image_url ? (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-accent/75 to-primary/70" />
          ) : null}
        </div>

        <CardContent className="relative px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
            <div className="-mt-16 sm:-mt-20 z-10 flex shrink-0 justify-center sm:justify-start">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={160}
                  height={160}
                  className="h-32 w-32 rounded-full border-4 border-card object-cover sm:h-40 sm:w-40"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-card bg-muted text-3xl font-bold sm:h-40 sm:w-40 sm:text-4xl">
                  {initials}
                </div>
              )}
            </div>

            <div className="mt-3 flex-1 text-center sm:mt-0 sm:text-start">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>
                  {profile.username ? (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  ) : null}
                </div>
                {profile.role && profile.role !== "member" ? (
                  <Badge className="rounded-full px-3 py-1 text-xs font-medium">
                    {t(`role.${profile.role}`)}
                  </Badge>
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-2 text-sm text-foreground/90">{profile.bio}</p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
                {profile.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} />
                    {profile.city}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} />
                  {t("joined")} {joinDate}
                </span>
              </div>
              {showRecognition ? (
              <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary sm:justify-start">
                <Heart size={16} fill="currentColor" />
                <span>{contributionScore} {t("contributionScore")}</span>
                <span className="text-primary/60">•</span>
                <span>{t(`contributionRanks.${contributionRank}`)}</span>
              </div>
              ) : null}
            </div>

            <div className="mt-3 flex justify-center sm:mt-0 sm:self-center">
              <div className="flex flex-col items-center gap-2">
                {isOwnProfile ? (
                  <Link href="/profile">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20">
                      {t("editProfile")}
                    </span>
                  </Link>
                ) : null}
                <FollowSummary
                  profileId={profile.id}
                  username={profile.username}
                  locale={locale}
                  currentUserId={currentUserId}
                  initialIsFollowing={currentUserIsFollowing}
                  initialFollowersCount={followStats.followersCount}
                  followingCount={followStats.followingCount}
                  showButton={!isOwnProfile}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3 sm:gap-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg font-bold sm:text-xl">{postsCount}</p>
              <p className="text-xs text-muted-foreground">{t("stats.posts")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold sm:text-xl">{memoriesCount}</p>
              <p className="text-xs text-muted-foreground">{t("stats.memories")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold sm:text-xl">{ideasCount}</p>
              <p className="text-xs text-muted-foreground">{t("stats.ideas")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold sm:text-xl">{commentsCount}</p>
              <p className="text-xs text-muted-foreground">{t("stats.comments")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showRecognition && impact ? (
        <CommunityImpactSection
          impact={impact}
          locale={locale}
          showPassportLink={isOwnProfile}
          showVolunteer={showVolunteerHours}
          showGraatek={showGraatek}
          showMemories={showMemories}
        />
      ) : null}

      <Suspense fallback={<ProfileTabsFallback />}>
        <ProfileTabsFetcher
          profileId={profile.id}
          locale={locale}
          currentUserId={currentUserId}
          initialTab={currentTab}
          profile={{
            id: profile.id,
            full_name: profile.full_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            cover_image_url: profile.cover_image_url,
            bio: profile.bio,
            city: profile.city,
            hometown: profile.hometown ?? null,
            languages_spoken: profile.languages_spoken ?? [],
            contribution_score: contributionScore,
            created_at: profile.created_at,
          }}
          isOwnProfile={isOwnProfile}
          showMemories={showMemories}
          showGraatek={showGraatek}
        />
      </Suspense>
    </div>
  );
}
