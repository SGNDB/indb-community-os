-- Add phone column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Unique index on phone
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON public.profiles (phone)
  WHERE phone IS NOT NULL;

-- Update the auto-create profile trigger to include phone
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

-- RLS: users can read their own phone
DROP POLICY IF EXISTS "profiles_read_self_or_public" ON public.profiles;
CREATE POLICY "profiles_read_self_or_public"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    role IS NOT NULL
  );
