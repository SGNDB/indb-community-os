-- ============================================================
-- Direct legacy admin cleanup preparation
-- ============================================================
-- Legacy admin:
--   email: sena@gmail.com
--   uid:   4f9c7a95-b626-432f-b47e-b22a5cdea8dd
--
-- This migration intentionally does NOT call helper functions such as
-- public.remove_legacy_admin_by_email(...). It performs direct verification
-- and database preparation only.
--
-- Auth-user deletion should be done after this migration through:
--   Supabase Dashboard -> Authentication -> Users -> sena@gmail.com -> Delete user
--
-- This migration:
--   1. Verifies the legacy UID/email pair if the auth user still exists.
--   2. Requires a different phone-synthetic admin to exist before demotion.
--   3. Demotes the legacy profile from admin to member.
--   4. Preserves content rows by nulling legacy profile references.
--   5. Deletes only private account-owned rows like saves/reactions/follows.
--   6. Refuses to continue if a remaining FK would cascade-delete data.
-- ============================================================

create or replace function public.is_strict_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and role = 'admin'
  );
$$;

grant execute on function public.is_strict_admin(uuid) to authenticated;

drop function if exists public.remove_legacy_admin_by_email(uuid, text);
drop function if exists public.remove_legacy_admin(uuid, uuid);
drop function if exists public.promote_phone_admin(text);
drop function if exists public.audit_admin_identities();
drop function if exists public.normalize_mauritania_phone(text);
drop function if exists public.to_synthetic_phone_email(text);

-- Preserve idea/memory comments when the legacy profile is removed.
-- These tables used ON DELETE CASCADE originally; top-level comments already
-- use ON DELETE SET NULL.
do $$
begin
  if to_regclass('public.idea_comments') is not null then
    execute 'alter table public.idea_comments alter column author_id drop not null';
    execute 'alter table public.idea_comments drop constraint if exists idea_comments_author_id_fkey';
    execute 'alter table public.idea_comments add constraint idea_comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null';
  end if;

  if to_regclass('public.memory_comments') is not null then
    execute 'alter table public.memory_comments alter column author_id drop not null';
    execute 'alter table public.memory_comments drop constraint if exists memory_comments_author_id_fkey';
    execute 'alter table public.memory_comments add constraint memory_comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete set null';
  end if;

  if to_regclass('public.community_credits') is not null then
    execute 'alter table public.community_credits alter column user_id drop not null';
    execute 'alter table public.community_credits drop constraint if exists community_credits_user_id_fkey';
    execute 'alter table public.community_credits add constraint community_credits_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null';
  end if;
end $$;

do $$
declare
  legacy_uid constant uuid := '4f9c7a95-b626-432f-b47e-b22a5cdea8dd'::uuid;
  legacy_email constant text := 'sena@gmail.com';

  -- Optional: if no phone admin exists yet, set one of these before running.
  -- Example:
  --   new_phone_admin_uid uuid := 'NEW_PHONE_USER_UUID'::uuid;
  --   new_phone_admin_phone text := '+22237225588';
  new_phone_admin_uid uuid := null;
  new_phone_admin_phone text := null;

  legacy_auth record;
  legacy_profile record;
  phone_admin record;
  cascade_reference record;
  reference_count bigint;
  affected_count bigint;
begin
  select id, email, created_at
  into legacy_auth
  from auth.users
  where id = legacy_uid;

  if found and lower(coalesce(legacy_auth.email, '')) <> legacy_email then
    raise exception 'Refusing cleanup: uid % belongs to %, not %',
      legacy_uid,
      legacy_auth.email,
      legacy_email;
  end if;

  if not found then
    raise notice 'Auth user % is already missing. Continuing to clean/verify profile references.', legacy_uid;
  else
    raise notice 'Verified legacy auth user: % / %', legacy_uid, legacy_auth.email;
  end if;

  select id, full_name, username, phone, role, created_at
  into legacy_profile
  from public.profiles
  where id = legacy_uid;

  if found then
    raise notice 'Legacy profile found with role=% phone=% username=%',
      legacy_profile.role,
      legacy_profile.phone,
      legacy_profile.username;
  else
    raise notice 'Legacy profile row is already missing.';
  end if;

  if new_phone_admin_uid is not null then
    update public.profiles p
    set role = 'admin', updated_at = now()
    from auth.users u
    where p.id = new_phone_admin_uid
      and u.id = p.id
      and lower(coalesce(u.email, '')) like '%@phone.indb.local';

    get diagnostics affected_count = row_count;

    if affected_count <> 1 then
      raise exception 'Could not promote new_phone_admin_uid %. It must be a registered phone-auth user.',
        new_phone_admin_uid;
    end if;
  elsif new_phone_admin_phone is not null then
    update public.profiles p
    set role = 'admin', updated_at = now()
    from auth.users u
    where p.phone = new_phone_admin_phone
      and u.id = p.id
      and lower(coalesce(u.email, '')) like '%@phone.indb.local';

    get diagnostics affected_count = row_count;

    if affected_count <> 1 then
      raise exception 'Could not promote phone %. It must match exactly one registered phone-auth profile.',
        new_phone_admin_phone;
    end if;
  end if;

  select p.id, p.phone, u.email
  into phone_admin
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id <> legacy_uid
    and p.role = 'admin'
    and p.phone is not null
    and lower(coalesce(u.email, '')) like '%@phone.indb.local'
  order by p.created_at nulls last
  limit 1;

  if not found then
    raise exception 'No phone-based admin exists. Register a phone account and set profiles.role = admin before deleting %.',
      legacy_email;
  end if;

  raise notice 'Confirmed phone-based admin exists: uid=% phone=% email=%',
    phone_admin.id,
    phone_admin.phone,
    phone_admin.email;

  update public.profiles
  set role = 'member', updated_at = now()
  where id = legacy_uid
    and role = 'admin';

  get diagnostics affected_count = row_count;
  raise notice 'Removed admin role from legacy profile rows: %', affected_count;

  -- Preserve authored/platform content by removing the profile reference,
  -- not the content row.
  if to_regclass('public.posts') is not null then
    execute 'update public.posts set author_id = null where author_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.comments') is not null then
    execute 'update public.comments set author_id = null where author_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.ideas') is not null then
    execute 'update public.ideas set author_id = null where author_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.idea_comments') is not null then
    execute 'update public.idea_comments set author_id = null where author_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memories') is not null then
    execute 'update public.memories set contributor_id = null where contributor_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memory_media') is not null then
    execute 'update public.memory_media set uploader_id = null where uploader_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memory_comments') is not null then
    execute 'update public.memory_comments set author_id = null where author_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.reports') is not null then
    execute 'update public.reports set reporter_id = null where reporter_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.events') is not null then
    execute 'update public.events set creator_id = null where creator_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.projects') is not null then
    execute 'update public.projects set creator_id = null where creator_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.polls') is not null then
    execute 'update public.polls set creator_id = null where creator_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.community_credits') is not null then
    execute 'update public.community_credits set user_id = null where user_id = $1' using legacy_uid;
    execute 'update public.community_credits set awarded_by = null where awarded_by = $1' using legacy_uid;
  end if;

  if to_regclass('public.admin_audit_logs') is not null then
    execute 'update public.admin_audit_logs set admin_id = null where admin_id = $1' using legacy_uid;
  end if;

  -- Delete private account-owned rows. These are not community content.
  if to_regclass('public.saved_posts') is not null then
    execute 'delete from public.saved_posts where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.post_likes') is not null then
    execute 'delete from public.post_likes where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.post_reactions') is not null then
    execute 'delete from public.post_reactions where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.idea_votes') is not null then
    execute 'delete from public.idea_votes where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memory_reactions') is not null then
    execute 'delete from public.memory_reactions where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memory_likes') is not null then
    execute 'delete from public.memory_likes where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.saved_memories') is not null then
    execute 'delete from public.saved_memories where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.memory_saves') is not null then
    execute 'delete from public.memory_saves where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.poll_votes') is not null then
    execute 'delete from public.poll_votes where user_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.user_follows') is not null then
    execute 'delete from public.user_follows where follower_id = $1 or following_id = $1' using legacy_uid;
  end if;

  if to_regclass('public.notifications') is not null then
    execute 'delete from public.notifications where user_id = $1 or actor_id = $1' using legacy_uid;
  end if;

  -- Final guard: if any remaining profile FK would cascade-delete rows when
  -- the auth user is deleted from Dashboard, stop and require manual transfer.
  for cascade_reference in
    select
      c.conrelid::regclass as relation_name,
      a.attname as column_name,
      c.conname as constraint_name
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.confrelid = 'public.profiles'::regclass
      and c.confdeltype = 'c'
      and array_length(c.conkey, 1) = 1
  loop
    execute format(
      'select count(*) from %s where %I = $1',
      cascade_reference.relation_name,
      cascade_reference.column_name
    )
    into reference_count
    using legacy_uid;

    if reference_count > 0 then
      raise exception
        'Stop before Dashboard deletion: % row(s) in %.% would cascade-delete via %. Transfer or preserve them first.',
        reference_count,
        cascade_reference.relation_name,
        cascade_reference.column_name,
        cascade_reference.constraint_name;
    end if;
  end loop;

  raise notice 'Legacy admin is demoted and safe for Dashboard auth deletion: % / %',
    legacy_uid,
    legacy_email;
end $$;

-- Verification queries to run after Dashboard auth deletion.
-- Expected after deletion:
--   old_auth_rows = 0
--   old_profile_rows = 0
--   phone_admin_rows >= 1
select count(*) as old_auth_rows
from auth.users
where id = '4f9c7a95-b626-432f-b47e-b22a5cdea8dd'::uuid
  and lower(email) = 'sena@gmail.com';

select count(*) as old_profile_rows
from public.profiles
where id = '4f9c7a95-b626-432f-b47e-b22a5cdea8dd'::uuid;

select p.id as new_admin_uid, p.phone, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
  and p.id <> '4f9c7a95-b626-432f-b47e-b22a5cdea8dd'::uuid
  and p.phone is not null
  and lower(coalesce(u.email, '')) like '%@phone.indb.local'
order by p.created_at nulls last;
