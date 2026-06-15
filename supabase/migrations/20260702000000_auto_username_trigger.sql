-- Recreate handle_new_user_profile to auto-generate username internally from user ID
-- matching the format: 'u' + 12 prefix characters of UUID (without dashes)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  auto_username text;
BEGIN
  -- Generate auto-username matching JS: u + 12 characters of UUID without dashes
  auto_username := 'u' || substring(replace(NEW.id::text, '-', '') from 1 for 12);

  INSERT INTO public.profiles (id, full_name, username, avatar_url, phone, role, language_preference)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    auto_username,
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone',
    'member',
    coalesce(NEW.raw_user_meta_data ->> 'language_preference', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
