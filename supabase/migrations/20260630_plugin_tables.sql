-- Plugin Platform Tables
-- Run these migrations against your Supabase project via the SQL Editor or migration tool.

-- Plugin Settings: Key-value store scoped to each plugin
CREATE TABLE IF NOT EXISTS plugin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_settings_plugin_id ON plugin_settings (plugin_id);

-- Plugin Versions: Track installed/in-use versions of each plugin
CREATE TABLE IF NOT EXISTS plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plugin Logs: Audit trail of plugin activity
CREATE TABLE IF NOT EXISTS plugin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plugin_logs_plugin_id ON plugin_logs (plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_logs_created_at ON plugin_logs (created_at DESC);

-- Enable Row Level Security
ALTER TABLE plugin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can read/write plugin settings
CREATE POLICY "Admins can manage plugin_settings"
  ON plugin_settings
  USING (auth.role() = 'authenticated' AND (SELECT role::text FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator'));

-- RLS: Admins can read/write plugin versions
CREATE POLICY "Admins can manage plugin_versions"
  ON plugin_versions
  USING (auth.role() = 'authenticated' AND (SELECT role::text FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator'));

-- RLS: Authenticated users can read logs, only admins can write
CREATE POLICY "Authenticated users can read plugin_logs"
  ON plugin_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write plugin_logs"
  ON plugin_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND (SELECT role::text FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator'));
