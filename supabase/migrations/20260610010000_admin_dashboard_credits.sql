alter table public.profiles
  add column if not exists role text not null default 'member';

alter table public.profiles
  add column if not exists contribution_score integer not null default 0;

create table if not exists public.community_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points > 0),
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  awarded_by uuid references public.profiles(id)
);

alter table public.community_credits enable row level security;

create index if not exists community_credits_user_id_created_at_idx
  on public.community_credits(user_id, created_at desc);

create index if not exists profiles_contribution_score_idx
  on public.profiles(contribution_score desc);

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
    where id = uid and role = 'admin'
  );
$$;

grant execute on function public.is_strict_admin(uuid) to authenticated;

drop policy if exists "community_credits_admin_read" on public.community_credits;
create policy "community_credits_admin_read" on public.community_credits
  for select using (
    user_id = auth.uid()
    or public.is_strict_admin(auth.uid())
  );

drop policy if exists "community_credits_admin_insert" on public.community_credits;
create policy "community_credits_admin_insert" on public.community_credits
  for insert with check (
    awarded_by = auth.uid()
    and public.is_strict_admin(auth.uid())
  );

drop policy if exists "profiles_admin_update_role_score" on public.profiles;
create policy "profiles_admin_update_role_score" on public.profiles
  for update using (public.is_strict_admin(auth.uid()))
  with check (public.is_strict_admin(auth.uid()));

drop policy if exists "posts_admin_delete" on public.posts;
create policy "posts_admin_delete" on public.posts
  for delete using (public.is_strict_admin(auth.uid()));

drop policy if exists "ideas_admin_delete" on public.ideas;
create policy "ideas_admin_delete" on public.ideas
  for delete using (public.is_strict_admin(auth.uid()));

drop policy if exists "memories_admin_delete" on public.memories;
create policy "memories_admin_delete" on public.memories
  for delete using (public.is_strict_admin(auth.uid()));

create or replace function public.award_community_credit(
  target_user_id uuid,
  credit_points integer,
  credit_reason text,
  credit_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_strict_admin(auth.uid()) then
    raise exception 'Only admins can award community credits';
  end if;

  if credit_points not in (5, 10, 25, 50, 100) then
    raise exception 'Invalid community credit amount';
  end if;

  if target_user_id is null or not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Profile not found';
  end if;

  if nullif(trim(credit_reason), '') is null then
    raise exception 'Credit reason is required';
  end if;

  insert into public.community_credits (user_id, points, reason, note, awarded_by)
  values (target_user_id, credit_points, nullif(trim(credit_reason), ''), nullif(trim(credit_note), ''), auth.uid());

  update public.profiles
  set contribution_score = coalesce(contribution_score, 0) + credit_points
  where id = target_user_id;
end;
$$;

grant execute on function public.award_community_credit(uuid, integer, text, text) to authenticated;
