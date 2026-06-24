-- Add last_login column to profiles for tracking user activity
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Index for last_login queries (active today, DAU, etc.)
CREATE INDEX IF NOT EXISTS profiles_last_login_idx ON public.profiles (last_login)
  WHERE last_login IS NOT NULL;

-- Trigger to update last_login on auth sign-in
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF updated_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
  EXECUTE FUNCTION handle_user_login();
