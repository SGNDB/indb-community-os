-- Follow list privacy + follower/following list RPCs
-- Replaces show_followers/show_following booleans with proper visibility enums
-- and count-only toggles.

-- Drop old boolean columns (added in 20260815000000, replaced by proper enums)
alter table public.user_settings
  drop column if exists show_followers,
  drop column if exists show_following;

-- Add new columns
alter table public.user_settings
  add column if not exists followers_visibility text not null default 'everyone',
  add column if not exists following_visibility text not null default 'everyone',
  add column if not exists show_followers_count boolean not null default true,
  add column if not exists show_following_count boolean not null default true;

-- Add constraints
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_settings'::regclass
      and conname = 'user_settings_followers_visibility_check'
  ) then
    alter table public.user_settings
      add constraint user_settings_followers_visibility_check
      check (followers_visibility in ('everyone', 'followers', 'no_one'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_settings'::regclass
      and conname = 'user_settings_following_visibility_check'
  ) then
    alter table public.user_settings
      add constraint user_settings_following_visibility_check
      check (following_visibility in ('everyone', 'followers', 'no_one'));
  end if;
end $$;

-- Helper: checks if viewer can see the target's followers list
create or replace function public.can_view_followers(
  target_user_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  vis text;
begin
  if viewer_id = target_user_id then
    return true;
  end if;

  if viewer_id is null then
    return false;
  end if;

  select coalesce(followers_visibility, 'everyone') into vis
  from public.user_settings
  where user_id = target_user_id;

  if vis = 'everyone' then
    return true;
  end if;

  if vis = 'followers' then
    return exists (
      select 1 from public.user_follows
      where follower_id = viewer_id
        and following_id = target_user_id
    );
  end if;

  return false;
end;
$$;

-- Helper: checks if viewer can see the target's following list
create or replace function public.can_view_following(
  target_user_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  vis text;
begin
  if viewer_id = target_user_id then
    return true;
  end if;

  if viewer_id is null then
    return false;
  end if;

  select coalesce(following_visibility, 'everyone') into vis
  from public.user_settings
  where user_id = target_user_id;

  if vis = 'everyone' then
    return true;
  end if;

  if vis = 'followers' then
    return exists (
      select 1 from public.user_follows
      where follower_id = viewer_id
        and following_id = target_user_id
    );
  end if;

  return false;
end;
$$;

-- RPC: get followers list with privacy enforcement, pagination, search
drop function if exists public.get_followers(uuid, uuid, int, int, text);
create or replace function public.get_followers(
  target_user_id uuid,
  viewer_id uuid default auth.uid(),
  page int default 1,
  page_size int default 30,
  search_query text default ''
)
returns table (
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  is_online boolean,
  community_level text,
  contribution_score int,
  is_following boolean,
  can_message boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  can_view boolean;
  offset_val int;
begin
  can_view := public.can_view_followers(target_user_id, viewer_id);

  if not can_view then
    return;
  end if;

  offset_val := (page - 1) * page_size;

  return query
  with viewer_follows as (
    select following_id from public.user_follows where follower_id = viewer_id
  ),
  viewer_messages as (
    select us.user_id
    from public.user_settings us
    where us.message_permission = 'everyone'
       or (us.message_permission = 'followers'
           and exists (select 1 from public.user_follows uf where uf.follower_id = viewer_id and uf.following_id = us.user_id))
  )
  select
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    false::boolean as is_online,
    case
      when p.contribution_score >= 2000 then 'guardian_of_nouadhibou'
      when p.contribution_score >= 1000 then 'community_champion'
      when p.contribution_score >= 500 then 'community_builder'
      when p.contribution_score >= 100 then 'active_contributor'
      else 'community_supporter'
    end as community_level,
    p.contribution_score,
    exists (select 1 from viewer_follows vf where vf.following_id = p.id) as is_following,
    exists (select 1 from viewer_messages vm where vm.user_id = p.id) as can_message
  from public.user_follows uf
  join public.profiles p on p.id = uf.follower_id
  where uf.following_id = target_user_id
    and (search_query = '' or p.full_name ilike '%' || search_query || '%' or p.username ilike '%' || search_query || '%')
  order by uf.created_at desc
  limit page_size
  offset offset_val;
end;
$$;

-- RPC: get following list with privacy enforcement, pagination, search
drop function if exists public.get_following(uuid, uuid, int, int, text);
create or replace function public.get_following(
  target_user_id uuid,
  viewer_id uuid default auth.uid(),
  page int default 1,
  page_size int default 30,
  search_query text default ''
)
returns table (
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  is_online boolean,
  community_level text,
  contribution_score int,
  is_following boolean,
  can_message boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  can_view boolean;
  offset_val int;
begin
  can_view := public.can_view_following(target_user_id, viewer_id);

  if not can_view then
    return;
  end if;

  offset_val := (page - 1) * page_size;

  return query
  with viewer_follows as (
    select following_id from public.user_follows where follower_id = viewer_id
  ),
  viewer_messages as (
    select us.user_id
    from public.user_settings us
    where us.message_permission = 'everyone'
       or (us.message_permission = 'followers'
           and exists (select 1 from public.user_follows uf where uf.follower_id = viewer_id and uf.following_id = us.user_id))
  )
  select
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    false::boolean as is_online,
    case
      when p.contribution_score >= 2000 then 'guardian_of_nouadhibou'
      when p.contribution_score >= 1000 then 'community_champion'
      when p.contribution_score >= 500 then 'community_builder'
      when p.contribution_score >= 100 then 'active_contributor'
      else 'community_supporter'
    end as community_level,
    p.contribution_score,
    exists (select 1 from viewer_follows vf where vf.following_id = p.id) as is_following,
    exists (select 1 from viewer_messages vm where vm.user_id = p.id) as can_message
  from public.user_follows uf
  join public.profiles p on p.id = uf.following_id
  where uf.follower_id = target_user_id
    and (search_query = '' or p.full_name ilike '%' || search_query || '%' or p.username ilike '%' || search_query || '%')
  order by uf.created_at desc
  limit page_size
  offset offset_val;
end;
$$;

-- RPC: get total count of followers (respects count visibility)
create or replace function public.get_followers_count(
  target_user_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  show_count boolean;
  result int;
begin
  select coalesce(show_followers_count, true) into show_count
  from public.user_settings
  where user_id = target_user_id;

  if not show_count then
    return 0;
  end if;

  select count(*) into result
  from public.user_follows
  where following_id = target_user_id;

  return result;
end;
$$;

-- RPC: get total count of following (respects count visibility)
create or replace function public.get_following_count(
  target_user_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  show_count boolean;
  result int;
begin
  select coalesce(show_following_count, true) into show_count
  from public.user_settings
  where user_id = target_user_id;

  if not show_count then
    return 0;
  end if;

  select count(*) into result
  from public.user_follows
  where follower_id = target_user_id;

  return result;
end;
$$;

-- Update get_public_profile_privacy
drop function if exists public.get_public_profile_privacy(uuid);
create or replace function public.get_public_profile_privacy(target_user_id uuid)
returns table (
  message_permission text,
  show_community_recognition boolean,
  show_volunteer_hours boolean,
  show_completed_graatek boolean,
  show_memories boolean,
  recognition_visibility jsonb,
  show_online_status boolean,
  last_seen_visibility text,
  phone_visibility text,
  email_visibility text,
  followers_visibility text,
  following_visibility text,
  show_followers_count boolean,
  show_following_count boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(us.message_permission, 'everyone') as message_permission,
    coalesce(us.show_community_recognition, true) as show_community_recognition,
    coalesce(us.show_volunteer_hours, true) as show_volunteer_hours,
    coalesce(us.show_completed_graatek, true) as show_completed_graatek,
    coalesce(us.show_memories, true) as show_memories,
    coalesce(
      us.recognition_visibility,
      '{"level":true,"badges":true,"summary":true,"donations":false,"volunteer":true}'::jsonb
    ) as recognition_visibility,
    coalesce(us.show_online_status, false) as show_online_status,
    coalesce(us.last_seen_visibility, 'everyone') as last_seen_visibility,
    coalesce(us.phone_visibility, 'only_me') as phone_visibility,
    coalesce(us.email_visibility, 'no_one') as email_visibility,
    coalesce(us.followers_visibility, 'everyone') as followers_visibility,
    coalesce(us.following_visibility, 'everyone') as following_visibility,
    coalesce(us.show_followers_count, true) as show_followers_count,
    coalesce(us.show_following_count, true) as show_following_count
  from public.profiles p
  left join public.user_settings us on us.user_id = p.id
  where p.id = target_user_id
  limit 1;
$$;

grant execute on function public.get_public_profile_privacy(uuid) to authenticated, anon;
grant execute on function public.can_view_followers(uuid, uuid) to authenticated, anon;
grant execute on function public.can_view_following(uuid, uuid) to authenticated, anon;
grant execute on function public.get_followers(uuid, uuid, int, int, text) to authenticated, anon;
grant execute on function public.get_following(uuid, uuid, int, int, text) to authenticated, anon;
grant execute on function public.get_followers_count(uuid) to authenticated, anon;
grant execute on function public.get_following_count(uuid) to authenticated, anon;
