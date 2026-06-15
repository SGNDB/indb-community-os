-- Auto-generate username from user ID in the profile trigger
-- so username is never required from the user during registration

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  auto_username text;
BEGIN
  auto_username := 'u' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.profiles (id, full_name, username, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    auto_username,
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
