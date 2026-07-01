import type {ContentLanguage, ReactionType, ProfileRow} from "@/types/database";

export type MemoryVerificationStatus = "pending" | "approved" | "rejected" | "needs_more_info";

export type MemoryReactionType = ReactionType;

export interface MemoryRow {
  id: string;
  contributor_id: string | null;
  title: string;
  description: string | null;
  content_language: ContentLanguage | null;
  decade: string | null;
  year: number | null;
  location: string | null;
  category: string | null;
  media_url: string | null;
  media_type: string;
  verification_status: MemoryVerificationStatus;
  tags: string[] | null;
  shares_count: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryMediaRow {
  id: string;
  memory_id: string;
  url: string;
  type: "image" | "video";
  mime_type: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface MemoryReactionRow {
  id: string;
  memory_id: string;
  user_id: string;
  reaction_type: MemoryReactionType;
  created_at: string;
  updated_at: string;
}

export interface MemoryCommentRow {
  id: string;
  memory_id: string;
  author_id: string | null;
  content: string;
  content_language: ContentLanguage | null;
  created_at: string;
  updated_at: string;
}

export interface SavedMemoryRow {
  id: string;
  memory_id: string;
  user_id: string;
  created_at: string;
}

export interface MemoryWithContributor extends MemoryRow {
  contributor: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
  media?: MemoryMediaRow[];
  reaction_counts?: Record<string, number>;
  user_reaction?: MemoryReactionType | null;
  user_saved?: boolean;
  comments_count?: number;
}

export interface MemoryCommentWithAuthor extends MemoryCommentRow {
  author: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}
