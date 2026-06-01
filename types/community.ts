export type CommunityRole =
  | "visitor"
  | "member"
  | "contributor"
  | "historian"
  | "moderator"
  | "admin";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: CommunityRole;
}

export interface PostWithRelations {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  created_at: string;
  profiles: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
  categories: {
    id: number;
    name: string;
    slug: string;
  } | null;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    profiles: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
  }>;
  post_likes: Array<{id: string; user_id: string}>;
}

