-- Add is_test column to all content tables for safe test data management.
-- This allows marking synthetic/test data so it can be easily cleaned up.
-- All new rows default to false, so existing behavior is unchanged.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE post_reactions ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE idea_votes ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE idea_supporters ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE idea_participants ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE idea_comments ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE idea_messages ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE community_shares ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE community_share_requests ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE fadla_request_messages ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE user_follows ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
ALTER TABLE saved_memories ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Add an index on is_test for each table to make cleanup fast
CREATE INDEX IF NOT EXISTS idx_profiles_is_test ON profiles(is_test);
CREATE INDEX IF NOT EXISTS idx_posts_is_test ON posts(is_test);
CREATE INDEX IF NOT EXISTS idx_comments_is_test ON comments(is_test);
CREATE INDEX IF NOT EXISTS idx_post_reactions_is_test ON post_reactions(is_test);
CREATE INDEX IF NOT EXISTS idx_memories_is_test ON memories(is_test);
CREATE INDEX IF NOT EXISTS idx_ideas_is_test ON ideas(is_test);
CREATE INDEX IF NOT EXISTS idx_idea_votes_is_test ON idea_votes(is_test);
CREATE INDEX IF NOT EXISTS idx_idea_supporters_is_test ON idea_supporters(is_test);
CREATE INDEX IF NOT EXISTS idx_idea_participants_is_test ON idea_participants(is_test);
CREATE INDEX IF NOT EXISTS idx_idea_comments_is_test ON idea_comments(is_test);
CREATE INDEX IF NOT EXISTS idx_idea_messages_is_test ON idea_messages(is_test);
CREATE INDEX IF NOT EXISTS idx_community_shares_is_test ON community_shares(is_test);
CREATE INDEX IF NOT EXISTS idx_community_share_requests_is_test ON community_share_requests(is_test);
CREATE INDEX IF NOT EXISTS idx_fadla_request_messages_is_test ON fadla_request_messages(is_test);
CREATE INDEX IF NOT EXISTS idx_notifications_is_test ON notifications(is_test);
CREATE INDEX IF NOT EXISTS idx_user_follows_is_test ON user_follows(is_test);
CREATE INDEX IF NOT EXISTS idx_saved_posts_is_test ON saved_posts(is_test);
CREATE INDEX IF NOT EXISTS idx_saved_memories_is_test ON saved_memories(is_test);
