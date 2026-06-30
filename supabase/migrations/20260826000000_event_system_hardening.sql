-- Event System Hardening
-- 1. Create impact_events table if missing
-- 2. Add idempotency constraint to impact_events
-- 3. Lock impact_events RLS to server-only writes
-- 4. Revoke authenticated-user access to refresh_community_impact_for_user RPC

-- Create impact_events table (idempotent)
CREATE TABLE IF NOT EXISTS impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: prevent duplicate impact rows per (user, event_type, reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'impact_events_unique_event'
  ) THEN
    ALTER TABLE impact_events ADD CONSTRAINT impact_events_unique_event
      UNIQUE (user_id, event_type, reference_id);
  END IF;
END;
$$;

-- Enable RLS and lock to server-only writes
ALTER TABLE impact_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert impact events" ON impact_events;
DROP POLICY IF EXISTS "Server-only impact_events insert" ON impact_events;
CREATE POLICY "Server-only impact_events insert"
  ON impact_events FOR INSERT
  WITH CHECK (false);

-- Users can read their own impact events; admins can read all
DROP POLICY IF EXISTS "Users can view own impact_events" ON impact_events;
CREATE POLICY "Users can view own impact_events"
  ON impact_events FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all impact_events" ON impact_events;
CREATE POLICY "Admins can view all impact_events"
  ON impact_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_impact_events_user_id ON impact_events(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_events_event_type ON impact_events(event_type);

-- Restrict refresh_community_impact_for_user to service_role only.
-- This RPC is SECURITY DEFINER and accepts an arbitrary p_user_id,
-- so any authenticated user could recalculate another user's impact.
-- Server-side subscribers use createAdminClient() (service_role) instead.
REVOKE EXECUTE ON FUNCTION public.refresh_community_impact_for_user(uuid)
  FROM authenticated;
