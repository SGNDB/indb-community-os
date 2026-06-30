import type {ContentLanguage} from "@/types/database";
import type {ProfileRow} from "@/types/database";
import type {CategoryRow} from "@/types/database";

export type IdeaStatus = "published" | "interested" | "discussion" | "gathering_participants" | "approved" | "in_progress" | "completed" | "archived";

export type ContributionType = "volunteer_time" | "professional_skills" | "equipment" | "transportation" | "organization" | "other";

export type MilestoneStatus = "pending" | "completed";

export type ProgressImageStage = "before" | "progress" | "final";

export type IdeaBadge = "new_idea" | "growing_support" | "popular" | "community_priority" | "top_priority";

export type IdeaTrend = "rising" | "falling" | "stable";

export interface IdeaMediaRow {
  id: string;
  idea_id: string;
  url: string;
  type: "image" | "video";
  mime_type: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface IdeaRow {
  id: string;
  author_id: string | null;
  title: string;
  content_language: ContentLanguage | null;
  description: string;
  category_id: number | null;
  status: IdeaStatus;
  votes_count: number;
  shares_count: number;
  supporters_count: number;
  participants_count: number;
  community_impact_score: number;
  impact_score_updated_at: string | null;
  rank_90_day: number | null;
  trend: IdeaTrend | null;
  tags: string[];
  neighborhood: string | null;
  comments_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaCommentRow {
  id: string;
  idea_id: string;
  author_id: string | null;
  content: string;
  content_language: ContentLanguage | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaVoteRow {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export type IdeaParticipantStatus = "pending" | "accepted" | "declined";

export interface IdeaParticipantRow {
  id: string;
  idea_id: string;
  user_id: string;
  status: IdeaParticipantStatus;
  message: string | null;
  contribution_type: ContributionType | null;
  contribution_description: string | null;
  created_at: string;
}

export interface IdeaMessageRow {
  id: string;
  idea_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface IdeaSupporterRow {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface IdeaUpdateRow {
  id: string;
  idea_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface IdeaUpdateWithAuthor extends IdeaUpdateRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface IdeaBookmarkRow {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface IdeaMilestoneRow {
  id: string;
  idea_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface IdeaProgressImageRow {
  id: string;
  idea_id: string;
  stage: ProgressImageStage;
  url: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface IdeaWithAuthor extends IdeaRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
  category: Pick<CategoryRow, "id" | "slug" | "name_en" | "name_fr" | "name_ar" | "name_ff" | "name_snk" | "name_wo"> | null;
  media?: IdeaMediaRow[];
}

export interface IdeaWithSupport extends IdeaWithAuthor {
  supportPercentage: number;
  badge: IdeaBadge;
  rank: number | null;
}

export interface IdeaParticipantWithUser extends IdeaParticipantRow {
  user: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface IdeaMessageWithSender extends IdeaMessageRow {
  sender: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface IdeaCommentWithAuthor extends IdeaCommentRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}
