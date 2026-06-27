-- User Settings
-- Personal preferences, privacy controls, notification delivery, and account state.

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'members', 'private')),
  message_permission text not null default 'members' check (message_permission in ('everyone', 'members', 'followers', 'no_one')),
  show_community_recognition boolean not null default true,
  show_volunteer_hours boolean not null default true,
  show_completed_graatek boolean not null default true,
  show_memories boolean not null default true,
  recognition_visibility jsonb not null default '{"level":true,"badges":true,"summary":true}'::jsonb,
  in_app_notifications jsonb not null default '{"messages":true,"comments":true,"reactions":true,"followers":true,"graatek":true,"campaigns":true,"volunteer":true,"announcements":true}'::jsonb,
  email_notifications jsonb not null default '{"messages":false,"comments":false,"reactions":false,"followers":false,"graatek":false,"campaigns":true,"volunteer":true,"announcements":true}'::jsonb,
  contact_email text,
  font_size text not null default 'medium' check (font_size in ('small', 'medium', 'large')),
  high_contrast boolean not null default false,
  reduce_animations boolean not null default false,
  two_factor_prepared boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active', 'deactivated', 'pending_deletion')),
  deactivated_at timestamptz,
  deletion_requested_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_settings_account_status_idx
  on public.user_settings(account_status);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_owner_read" on public.user_settings;
create policy "user_settings_owner_read"
  on public.user_settings for select
  using (user_id = auth.uid());

drop policy if exists "user_settings_owner_insert" on public.user_settings;
create policy "user_settings_owner_insert"
  on public.user_settings for insert
  with check (user_id = auth.uid());

drop policy if exists "user_settings_owner_update" on public.user_settings;
create policy "user_settings_owner_update"
  on public.user_settings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_settings_admin_read" on public.user_settings;
create policy "user_settings_admin_read"
  on public.user_settings for select
  using (public.is_admin(auth.uid()));

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create or replace function public.ensure_user_settings(target_user_id uuid)
returns public.user_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.user_settings;
begin
  if auth.uid() <> target_user_id and not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  insert into public.user_settings (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  select * into result
  from public.user_settings
  where user_id = target_user_id;

  return result;
end;
$$;
