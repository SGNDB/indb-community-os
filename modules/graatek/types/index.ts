import type {ContentLanguage, ProfileRow} from "@/types/database";

export type FadlaStatus = "published" | "requested" | "reserved" | "collected" | "completed" | "archived";
export type GraatekStatus = FadlaStatus;

export type FadlaRequestStatus = "pending" | "accepted" | "declined" | "cancelled";
export type GraatekRequestStatus = FadlaRequestStatus;
export type RequestStatus = FadlaRequestStatus;

export type FadlaUrgency = "urgent" | "this_week" | "no_urgency";
export type GraatekUrgency = FadlaUrgency;

export type FadlaCategory =
  | "food"
  | "clothes"
  | "books"
  | "school_supplies"
  | "furniture"
  | "tools"
  | "electronics"
  | "medical"
  | "household"
  | "other";
export type GraatekCategory = FadlaCategory;

export type CompletionConfirmation = "received" | "handed_over";

export type CommunityShareStatus = "available" | "reserved" | "given";
export type CommunityShareCategory =
  | "food"
  | "clothes"
  | "furniture"
  | "electronics"
  | "school_supplies"
  | "books"
  | "services"
  | "other";

export interface CommunityShareImage {
  url: string;
  storagePath: string;
  type?: "image";
  mimeType?: string;
}

export interface CommunityShareRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  content_language: ContentLanguage | null;
  category: CommunityShareCategory;
  condition: string | null;
  location: string | null;
  status: CommunityShareStatus;
  images: CommunityShareImage[];
  shares_count: number;
  accepted_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityShareRequestRow {
  id: string;
  share_id: string;
  requester_id: string;
  created_at: string;
}

export interface FadlaItemRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  content_language: ContentLanguage | null;
  category: FadlaCategory;
  condition: string | null;
  location: string | null;
  quantity: number;
  urgency_level: FadlaUrgency;
  status: FadlaStatus;
  images: CommunityShareImage[];
  shares_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
  accepted_request_id: string | null;
  receiver_confirmed_at: string | null;
  sender_confirmed_at: string | null;
}

export interface FadlaRequestRow {
  id: string;
  share_id: string;
  requester_id: string;
  message: string | null;
  status: FadlaRequestStatus;
  collected_at: string | null;
  handed_over_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FadlaRequestMessageRow {
  id: string;
  share_id: string;
  request_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface FadlaRequestMessageWithSender extends FadlaRequestMessageRow {
  sender: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface FadlaImpact {
  people_helped: number;
  items_shared: number;
  completed_shares: number;
}

export interface FadlaWithOwner extends FadlaItemRow {
  owner: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
  requests?: FadlaRequestWithRequester[];
  requested_by_current_user?: boolean;
  requests_count?: number;
}

export interface FadlaRequestWithRequester extends FadlaRequestRow {
  requester: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface CommunityShareWithOwner extends CommunityShareRow {
  owner: Pick<ProfileRow, "id" | "username" | "full_name" | "avatar_url"> | null;
  requested_by_current_user?: boolean;
  requests_count?: number;
}
