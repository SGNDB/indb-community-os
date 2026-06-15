-- Profile Details System
-- Adds tables and columns for the Facebook-style profile details

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hometown text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}'::text[];

-- Profile work experience
CREATE TABLE IF NOT EXISTS profile_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_year integer NOT NULL,
  end_year integer,
  is_current boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_work_profile_id ON profile_work(profile_id);

-- Profile education
CREATE TABLE IF NOT EXISTS profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field_of_study text,
  start_year integer NOT NULL,
  end_year integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_education_profile_id ON profile_education(profile_id);

-- Profile interests
CREATE TABLE IF NOT EXISTS profile_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, name)
);

CREATE INDEX IF NOT EXISTS idx_profile_interests_profile_id ON profile_interests(profile_id);

-- Profile hobbies
CREATE TABLE IF NOT EXISTS profile_hobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, name)
);

CREATE INDEX IF NOT EXISTS idx_profile_hobbies_profile_id ON profile_hobbies(profile_id);

-- Profile links (handles ALL links and contact info with visibility)
CREATE TABLE IF NOT EXISTS profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  label text,
  value text NOT NULL,
  visibility text NOT NULL DEFAULT 'only_me',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_profile_links_profile_id ON profile_links(profile_id);

-- Profile travel
CREATE TABLE IF NOT EXISTS profile_travel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  country text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, country)
);

CREATE INDEX IF NOT EXISTS idx_profile_travel_profile_id ON profile_travel(profile_id);

-- Enable Row Level Security
ALTER TABLE profile_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_travel ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can manage (insert/update/delete) their own data
CREATE POLICY "Users manage their own work"
  ON profile_work FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users manage their own education"
  ON profile_education FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users manage their own interests"
  ON profile_interests FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users manage their own hobbies"
  ON profile_hobbies FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users manage their own links"
  ON profile_links FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users manage their own travel"
  ON profile_travel FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS policies: Anyone can read profile data
CREATE POLICY "Anyone can read work"
  ON profile_work FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read education"
  ON profile_education FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read interests"
  ON profile_interests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read hobbies"
  ON profile_hobbies FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read travel"
  ON profile_travel FOR SELECT
  USING (true);

-- Links are readable by all (visibility filtering done in app layer)
CREATE POLICY "Anyone can read links"
  ON profile_links FOR SELECT
  USING (true);
