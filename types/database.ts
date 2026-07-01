export type ContentLanguage = "ar" | "fr" | "en" | "ff" | "snk" | "wo";

export type CommunityRole = "member" | "contributor" | "historian" | "moderator" | "admin";

export type PostType = "community" | "news" | "memory" | "event" | "idea" | "project";
export type ProjectStatus = "planning" | "in_progress" | "recruiting" | "completed";
export type PostStatus = "published" | "hidden" | "archived";
export type CommentStatus = "published" | "hidden";
export type {MemoryVerificationStatus} from "@/modules/memories/types";
export type {IdeaStatus} from "@/modules/ideas/types";
export type {ContributionType} from "@/modules/ideas/types";
export type {MilestoneStatus} from "@/modules/ideas/types";
export type {ProgressImageStage} from "@/modules/ideas/types";
export type {IdeaBadge} from "@/modules/ideas/types";
export type {IdeaTrend} from "@/modules/ideas/types";
export type ReactionType = "like" | "love" | "support" | "celebrate" | "insightful" | "sad";
export type {MemoryReactionType} from "@/modules/memories/types";
export type ReportTargetType = "post" | "comment" | "memory" | "idea";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type {
  CommunityShareCategory,
  CommunityShareImage,
  CommunityShareRequestRow,
  CommunityShareRow,
  CommunityShareStatus,
  CommunityShareWithOwner,
  CompletionConfirmation,
  FadlaCategory,
  FadlaImpact,
  FadlaItemRow,
  FadlaRequestMessageRow,
  FadlaRequestMessageWithSender,
  FadlaRequestRow,
  FadlaRequestStatus,
  FadlaRequestWithRequester,
  FadlaStatus,
  FadlaUrgency,
  FadlaWithOwner,
  GraatekCategory,
  GraatekRequestStatus,
  GraatekStatus,
  GraatekUrgency,
  RequestStatus,
} from "@/modules/graatek/types";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  city: string | null;
  hometown: string | null;
  phone: string | null;
  phone_verified: boolean;
  last_login: string | null;
  languages_spoken: string[];
  role: CommunityRole;
  contribution_score: number;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export type UserThemePreference = "light" | "dark" | "system";
export type UserProfileVisibility = "public" | "members" | "followers" | "private";
export type UserMessagePermission = "everyone" | "followers" | "no_one";
export type UserLastSeenVisibility = "everyone" | "no_one";
export type UserPhoneVisibility = "only_me" | "followers" | "no_one";
export type UserEmailVisibility = "only_me" | "no_one";
export type UserFollowListVisibility = "everyone" | "followers" | "no_one";
export type UserFontSizePreference = "small" | "medium" | "large";
export type UserAccountStatus = "active" | "deactivated" | "pending_deletion";

export type UserNotificationKey =
  | "messages"
  | "comments"
  | "reactions"
  | "followers"
  | "graatek"
  | "campaigns"
  | "volunteer"
  | "announcements";

export interface UserSettingsRow {
  user_id: string;
  theme: UserThemePreference;
  profile_visibility: UserProfileVisibility;
  message_permission: UserMessagePermission;
  show_community_recognition: boolean;
  show_volunteer_hours: boolean;
  show_completed_graatek: boolean;
  show_memories: boolean;
  show_online_status: boolean;
  followers_visibility: UserFollowListVisibility;
  following_visibility: UserFollowListVisibility;
  show_followers_count: boolean;
  show_following_count: boolean;
  last_seen_visibility: UserLastSeenVisibility;
  phone_visibility: UserPhoneVisibility;
  email_visibility: UserEmailVisibility;
  recognition_visibility: {
    level: boolean;
    badges: boolean;
    summary: boolean;
    donations: boolean;
    volunteer: boolean;
  };
  in_app_notifications: Record<UserNotificationKey, boolean>;
  email_notifications: Record<UserNotificationKey, boolean>;
  contact_email: string | null;
  font_size: UserFontSizePreference;
  high_contrast: boolean;
  reduce_animations: boolean;
  two_factor_prepared: boolean;
  account_status: UserAccountStatus;
  deactivated_at: string | null;
  deletion_requested_at: string | null;
  updated_at: string;
}

export interface CommunityCreditRow {
  id: string;
  user_id: string | null;
  points: number;
  reason: string;
  note: string | null;
  created_at: string;
  awarded_by: string | null;
}

export interface CategoryRow {
  id: number;
  name_en: string;
  name_fr: string;
  name_ar: string;
  name_ff: string;
  name_snk: string;
  name_wo: string;
  slug: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface PostMediaRow {
  id: string;
  post_id: string;
  url: string;
  type: "image" | "video";
  mime_type: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string | null;
  category_id: number | null;
  type: PostType;
  title: string | null;
  content: string;
  content_language: ContentLanguage | null;
  image_url: string | null;
  status: PostStatus;
  language: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentTranslationRow {
  id: string;
  content_type: string;
  content_id: string;
  source_lang: ContentLanguage;
  target_lang: ContentLanguage;
  original_hash: string;
  translated_text: string;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string | null;
  parent_id: string | null;
  content: string;
  content_language: ContentLanguage | null;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export interface PostLikeRow {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface PostReactionRow {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
  updated_at: string;
}

export interface SavedPostRow {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface UserFollowRow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type {IdeaMediaRow} from "@/modules/ideas/types";

export type {MemoryRow} from "@/modules/memories/types";
export type {MemoryMediaRow} from "@/modules/memories/types";
export type {IdeaRow} from "@/modules/ideas/types";
export type {IdeaCommentRow} from "@/modules/ideas/types";
export type {IdeaVoteRow} from "@/modules/ideas/types";
export type {IdeaParticipantStatus} from "@/modules/ideas/types";
export type {IdeaParticipantRow} from "@/modules/ideas/types";
export type {IdeaMessageRow} from "@/modules/ideas/types";
export type {IdeaSupporterRow} from "@/modules/ideas/types";
export type {IdeaUpdateRow} from "@/modules/ideas/types";
export type {IdeaUpdateWithAuthor} from "@/modules/ideas/types";
export type {IdeaBookmarkRow} from "@/modules/ideas/types";
export type {IdeaMilestoneRow} from "@/modules/ideas/types";
export type {IdeaProgressImageRow} from "@/modules/ideas/types";

export interface ReportRow {
  id: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RecommendationEventRow {
  id: string;
  user_id: string;
  event_type: "post_view" | "post_like" | "post_comment" | "memory_save" | "memory_reaction" | "idea_support" | "idea_join" | "fadla_request" | "follow";
  entity_type: "post" | "memory" | "idea" | "community_share" | "profile";
  entity_id: string;
  weight: number;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationWithActor extends NotificationRow {
  actor: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  image_url: string | null;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  volunteers_count: number;
  progress: number;
  image_url: string | null;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollRow {
  id: string;
  question: string;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollOptionRow {
  id: string;
  poll_id: string;
  label: string;
  votes_count: number;
  created_at: string;
}

export interface PollVoteRow {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// ---- Joined types (used by UI) ----

export interface PostWithAuthor extends PostRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
  category: Pick<CategoryRow, "id" | "slug" | "name_en" | "name_fr" | "name_ar" | "name_ff" | "name_snk" | "name_wo"> | null;
  user_reaction?: ReactionType | null;
  reaction_counts?: Record<string, number>;
  user_saved?: boolean;
  media?: PostMediaRow[];
}

export type {MemoryReactionRow} from "@/modules/memories/types";
export type {MemoryCommentRow} from "@/modules/memories/types";
export type {SavedMemoryRow} from "@/modules/memories/types";
export type {MemoryWithContributor} from "@/modules/memories/types";
export type {MemoryCommentWithAuthor} from "@/modules/memories/types";
export type {IdeaWithAuthor} from "@/modules/ideas/types";
export type {IdeaWithSupport} from "@/modules/ideas/types";
export type {IdeaParticipantWithUser} from "@/modules/ideas/types";
export type {IdeaMessageWithSender} from "@/modules/ideas/types";
export type {IdeaCommentWithAuthor} from "@/modules/ideas/types";

export interface CommentWithAuthor extends CommentRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface ProfileWithCounts extends ProfileRow {
  posts_count: number;
  memories_count: number;
  ideas_count: number;
  comments_count: number;
  shares_count?: number;
  followers_count: number;
  following_count: number;
}

export type LinkPlatform = "phone" | "email" | "whatsapp" | "facebook" | "instagram" | "linkedin" | "telegram" | "website" | "portfolio" | "youtube" | "github" | "tiktok";
export type VisibilityLevel = "public" | "followers" | "only_me";

export interface ProfileWorkRow {
  id: string;
  profile_id: string;
  company: string;
  position: string;
  start_year: number;
  end_year: number | null;
  is_current: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileEducationRow {
  id: string;
  profile_id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number;
  end_year: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileInterestRow {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

export interface ProfileHobbyRow {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

export interface ProfileLinkRow {
  id: string;
  profile_id: string;
  platform: string;
  label: string | null;
  value: string;
  visibility: string;
  sort_order: number;
  created_at: string;
}

export interface ProfileTravelRow {
  id: string;
  profile_id: string;
  country: string;
  created_at: string;
}

export interface ProfileWithDetails extends ProfileWithCounts {
  hometown: string | null;
  languages_spoken: string[];
  work: ProfileWorkRow[];
  education: ProfileEducationRow[];
  interests: ProfileInterestRow[];
  hobbies: ProfileHobbyRow[];
  links: ProfileLinkRow[];
  travel: ProfileTravelRow[];
}

export interface EventWithCreator extends EventRow {
  creator: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface ProjectWithCreator extends ProjectRow {
  creator: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface PollWithOptions extends PollRow {
  options: PollOptionRow[];
}

// ========================
// Volunteer Opportunity
// ========================
export type VolunteerOpportunityStatus = "open" | "in_progress" | "full" | "completed" | "cancelled";

export interface VolunteerOpportunityRow {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string;
  long_description: string;
  organizer: string;
  organizer_id: string | null;
  location: string;
  date: string;
  duration: string;
  category: string;
  volunteers_needed: number;
  volunteers_joined: number;
  skills: string[];
  status: VolunteerOpportunityStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
}

export type VolunteerApplicationStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface VolunteerApplicationRow {
  id: string;
  opportunity_id: string;
  user_id: string;
  message: string | null;
  skills: string[];
  status: VolunteerApplicationStatus;
  created_at: string;
  updated_at: string;
}

export type VolunteerAttendanceStatus = "confirmed" | "absent" | "unmarked";

export interface VolunteerAttendanceRow {
  id: string;
  application_id: string;
  opportunity_id: string;
  user_id: string;
  hours: number;
  status: VolunteerAttendanceStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ========================
// Impact Events
// ========================
export type ImpactEventType =
  | "donation_verified"
  | "volunteer_activity_completed"
  | "graatek_exchange_completed"
  | "idea_completed"
  | "memory_published";

export interface ImpactEventRow {
  id: string;
  user_id: string;
  event_type: ImpactEventType;
  reference_id: string;
  reference_type: string;
  value: number;
  description: string | null;
  created_at: string;
}
