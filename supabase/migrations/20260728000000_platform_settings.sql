CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform_settings"
  ON platform_settings FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

CREATE POLICY "Admins can insert platform_settings"
  ON platform_settings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

CREATE POLICY "Admins can update platform_settings"
  ON platform_settings FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'moderator'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

INSERT INTO platform_settings (key, value) VALUES
  ('platform_settings', '{"platformName":"I ❤️ NDB","defaultLanguage":"ar","defaultTheme":"system","contactEmail":"","supportEmail":"","maintenanceMode":false}'),
  ('feature_flags', '{"ideas":true,"graatek":true,"memories":true,"messages":true,"support":true,"volunteering":true,"donations":true,"publicRegistration":true,"qrEntry":true,"translation":true,"realtime":true}'),
  ('languages', '[{"code":"ar","name":"Arabic","enabled":true,"isDefault":true},{"code":"fr","name":"French","enabled":true,"isDefault":false},{"code":"en","name":"English","enabled":true,"isDefault":false}]'),
  ('payment_methods', '[{"method":"bankily","enabled":true,"receiverName":"","receiverAccount":"","instructions":"","verificationRequired":true},{"method":"masrivi","enabled":true,"receiverName":"","receiverAccount":"","instructions":"","verificationRequired":true},{"method":"sedad","enabled":true,"receiverName":"","receiverAccount":"","instructions":"","verificationRequired":true},{"method":"visa","enabled":false,"receiverName":"","receiverAccount":"","instructions":"Card payments are processed via payment provider. No card numbers are stored.","verificationRequired":false},{"method":"mastercard","enabled":false,"receiverName":"","receiverAccount":"","instructions":"Card payments are processed via payment provider. No card numbers are stored.","verificationRequired":false}]')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name TEXT,
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON settings_audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

CREATE POLICY "Service can insert audit log"
  ON settings_audit_log FOR INSERT
  WITH CHECK (true);
