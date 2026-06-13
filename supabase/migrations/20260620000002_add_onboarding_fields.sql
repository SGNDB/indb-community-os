-- ============================================================
-- ADD ONBOARDING FIELDS TO PROFILES
-- Tracks whether a user has completed the onboarding flow
-- ============================================================

-- Add onboarding tracking fields to profiles
alter table public.profiles
  add column if not exists onboarding_completed boolean default false,
  add column if not exists onboarding_completed_at timestamptz null;

-- Add index for faster queries on onboarding status
create index if not exists idx_profiles_onboarding_completed
  on public.profiles(onboarding_completed)
  where onboarding_completed = false;
