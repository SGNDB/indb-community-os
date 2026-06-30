-- Event Logs: Persistent audit trail for platform events.
-- Writes happen server-side only (via service-role client).
-- SELECT is scoped: users see their own events, admins see all.

CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_actor_id ON event_logs(actor_id);

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Server-only writes: block all direct client INSERTs.
-- Only service_role (via createAdminClient) or triggers can write.
CREATE POLICY "Server-only event_logs insert"
  ON event_logs FOR INSERT
  WITH CHECK (false);

-- Users can view their own event logs
CREATE POLICY "Users can view own event_logs"
  ON event_logs FOR SELECT
  USING (actor_id = auth.uid());

-- Admins can view all event logs
CREATE POLICY "Admins can view all event_logs"
  ON event_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
