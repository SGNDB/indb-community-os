-- Community Impact aggregates for I Love NDB.
-- This is a positive contribution record, not a global social score.

create table if not exists public.community_impact_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  donations_total numeric(12,2) not null default 0 check (donations_total >= 0),
  donations_count integer not null default 0 check (donations_count >= 0),
  campaigns_supported integer not null default 0 check (campaigns_supported >= 0),
  last_donation_at timestamptz,
  volunteer_hours numeric(8,2) not null default 0 check (volunteer_hours >= 0),
  volunteer_activities integer not null default 0 check (volunteer_activities >= 0),
  volunteer_attendance_rate numeric(5,2) not null default 100 check (volunteer_attendance_rate >= 0 and volunteer_attendance_rate <= 100),
  current_opportunities integer not null default 0 check (current_opportunities >= 0),
  graatek_completed integer not null default 0 check (graatek_completed >= 0),
  graatek_shared integer not null default 0 check (graatek_shared >= 0),
  graatek_people_helped integer not null default 0 check (graatek_people_helped >= 0),
  graatek_completion_rate numeric(5,2) not null default 0 check (graatek_completion_rate >= 0 and graatek_completion_rate <= 100),
  ideas_created integer not null default 0 check (ideas_created >= 0),
  ideas_supported integer not null default 0 check (ideas_supported >= 0),
  ideas_completed integer not null default 0 check (ideas_completed >= 0),
  ideas_participants integer not null default 0 check (ideas_participants >= 0),
  memories_created integer not null default 0 check (memories_created >= 0),
  memories_views integer not null default 0 check (memories_views >= 0),
  memories_reactions integer not null default 0 check (memories_reactions >= 0),
  memories_featured integer not null default 0 check (memories_featured >= 0),
  badges text[] not null default '{}',
  community_level text not null default 'community_supporter'
    check (community_level in ('community_supporter', 'active_contributor', 'community_builder', 'community_champion', 'guardian_of_nouadhibou')),
  active_modules integer not null default 0 check (active_modules >= 0),
  last_updated timestamptz not null default now()
);

create index if not exists idx_community_impact_level
  on public.community_impact_stats(community_level);

create index if not exists idx_community_impact_last_updated
  on public.community_impact_stats(last_updated desc);

alter table public.community_impact_stats enable row level security;

drop policy if exists "community_impact_public_read" on public.community_impact_stats;
create policy "community_impact_public_read"
  on public.community_impact_stats for select
  to anon, authenticated
  using (true);

drop policy if exists "community_impact_admin_all" on public.community_impact_stats;
create policy "community_impact_admin_all"
  on public.community_impact_stats for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.community_impact_level_for_modules(
  p_active_modules integer,
  p_donations_count integer,
  p_volunteer_activities integer,
  p_graatek_completed integer,
  p_ideas_completed integer,
  p_memories_created integer
)
returns text
language sql
immutable
as $$
  select case
    when p_active_modules >= 5
      and p_volunteer_activities >= 6
      and p_graatek_completed >= 6
      and p_ideas_completed >= 2
      and p_memories_created >= 6
      then 'guardian_of_nouadhibou'
    when p_active_modules >= 4
      and (p_volunteer_activities + p_graatek_completed + p_ideas_completed + p_memories_created + least(p_donations_count, 8)) >= 18
      then 'community_champion'
    when p_active_modules >= 3
      and (p_volunteer_activities + p_graatek_completed + p_ideas_completed + p_memories_created + least(p_donations_count, 6)) >= 9
      then 'community_builder'
    when p_active_modules >= 2
      then 'active_contributor'
    else 'community_supporter'
  end;
$$;

create or replace function public.community_impact_badges(
  p_campaign_slugs text[],
  p_donations_count integer,
  p_volunteer_activities integer,
  p_graatek_completed integer,
  p_ideas_created integer,
  p_ideas_completed integer,
  p_memories_created integer,
  p_active_modules integer
)
returns text[]
language sql
immutable
as $$
  select array_remove(array[
    case when 'water' = any(p_campaign_slugs) then 'water_supporter' end,
    case when 'families' = any(p_campaign_slugs) then 'family_supporter' end,
    case when 'education' = any(p_campaign_slugs) then 'education_supporter' end,
    case when 'health' = any(p_campaign_slugs) then 'health_supporter' end,
    case when 'clean-nouadhibou' = any(p_campaign_slugs) then 'community_cleaner' end,
    case when p_volunteer_activities > 0 then 'volunteer' end,
    case when p_graatek_completed > 0 then 'graatek_helper' end,
    case when p_ideas_created > 0 or p_ideas_completed > 0 then 'innovator' end,
    case when p_memories_created > 0 then 'story_keeper' end,
    case when p_active_modules >= 3 or p_donations_count + p_volunteer_activities + p_graatek_completed + p_ideas_completed + p_memories_created >= 10 then 'community_builder' end
  ], null);
$$;

create or replace function public.refresh_community_impact_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donations_total numeric(12,2) := 0;
  v_donations_count integer := 0;
  v_campaigns_supported integer := 0;
  v_last_donation_at timestamptz;
  v_campaign_slugs text[] := '{}';
  v_volunteer_activities integer := 0;
  v_current_opportunities integer := 0;
  v_graatek_shared integer := 0;
  v_graatek_completed integer := 0;
  v_graatek_people_helped integer := 0;
  v_graatek_completion_rate numeric(5,2) := 0;
  v_ideas_created integer := 0;
  v_ideas_supported integer := 0;
  v_ideas_completed integer := 0;
  v_ideas_participants integer := 0;
  v_memories_created integer := 0;
  v_memories_reactions integer := 0;
  v_active_modules integer := 0;
  v_level text;
  v_badges text[];
begin
  if p_user_id is null then
    return;
  end if;

  if to_regclass('public.support_contributions') is not null then
    if to_regclass('public.support_campaigns') is not null then
      select
        coalesce(sum(sc.amount), 0),
        count(*)::integer,
        count(distinct sc.campaign_id)::integer,
        max(sc.created_at),
        coalesce(array_agg(distinct c.slug) filter (where c.slug is not null), '{}')
      into v_donations_total, v_donations_count, v_campaigns_supported, v_last_donation_at, v_campaign_slugs
      from public.support_contributions sc
      left join public.support_campaigns c on c.id = sc.campaign_id
      where sc.contributor_id = p_user_id
        and sc.contribution_type = 'money'
        and sc.status in ('verified', 'confirmed');
    else
      select
        coalesce(sum(sc.amount), 0),
        count(*)::integer,
        count(distinct sc.campaign_id)::integer,
        max(sc.created_at)
      into v_donations_total, v_donations_count, v_campaigns_supported, v_last_donation_at
      from public.support_contributions sc
      where sc.contributor_id = p_user_id
        and sc.contribution_type = 'money'
        and sc.status in ('verified', 'confirmed');
    end if;

    select count(*)::integer
    into v_volunteer_activities
    from public.support_contributions sc
    where sc.contributor_id = p_user_id
      and sc.contribution_type = 'volunteer'
      and sc.status in ('verified', 'confirmed');
  end if;

  if to_regclass('public.support_campaigns') is not null then
    select count(*)::integer
    into v_current_opportunities
    from public.support_campaigns
    where status = 'active';
  end if;

  if to_regclass('public.community_shares') is not null then
    select
      count(*)::integer,
      count(*) filter (where status in ('completed', 'archived', 'given'))::integer
    into v_graatek_shared, v_graatek_completed
    from public.community_shares
    where owner_id = p_user_id;
  end if;

  if to_regclass('public.community_shares') is not null
    and to_regclass('public.community_share_requests') is not null then
    select count(distinct csr.requester_id)::integer
    into v_graatek_people_helped
    from public.community_shares cs
    join public.community_share_requests csr on csr.share_id = cs.id
    where cs.owner_id = p_user_id
      and cs.status in ('completed', 'archived', 'given')
      and csr.status = 'accepted';
  end if;

  v_graatek_completion_rate := case
    when v_graatek_shared > 0 then round((v_graatek_completed::numeric / v_graatek_shared::numeric) * 100, 2)
    else 0
  end;

  if to_regclass('public.ideas') is not null then
    select
      count(*)::integer,
      count(*) filter (where status = 'completed')::integer
    into v_ideas_created, v_ideas_completed
    from public.ideas
    where author_id = p_user_id;
  end if;

  if to_regclass('public.idea_supporters') is not null then
    select count(*)::integer
    into v_ideas_supported
    from public.idea_supporters
    where user_id = p_user_id;
  end if;

  if to_regclass('public.idea_participants') is not null
    and to_regclass('public.ideas') is not null then
    select count(*)::integer
    into v_ideas_participants
    from public.idea_participants ip
    join public.ideas i on i.id = ip.idea_id
    where i.author_id = p_user_id
      and ip.status = 'accepted';
  end if;

  if to_regclass('public.memories') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'memories'
        and column_name = 'reactions_count'
    ) then
      select
        count(*)::integer,
        coalesce(sum(reactions_count), 0)::integer
      into v_memories_created, v_memories_reactions
      from public.memories
      where contributor_id = p_user_id
        and verification_status = 'approved';
    else
      select count(*)::integer
      into v_memories_created
      from public.memories
      where contributor_id = p_user_id
        and verification_status = 'approved';
    end if;
  end if;

  v_active_modules :=
    case when v_donations_count > 0 then 1 else 0 end +
    case when v_volunteer_activities > 0 then 1 else 0 end +
    case when v_graatek_shared > 0 or v_graatek_completed > 0 then 1 else 0 end +
    case when v_ideas_created > 0 or v_ideas_supported > 0 then 1 else 0 end +
    case when v_memories_created > 0 then 1 else 0 end;

  v_level := public.community_impact_level_for_modules(
    v_active_modules,
    v_donations_count,
    v_volunteer_activities,
    v_graatek_completed,
    v_ideas_completed,
    v_memories_created
  );

  v_badges := public.community_impact_badges(
    v_campaign_slugs,
    v_donations_count,
    v_volunteer_activities,
    v_graatek_completed,
    v_ideas_created,
    v_ideas_completed,
    v_memories_created,
    v_active_modules
  );

  insert into public.community_impact_stats (
    user_id,
    donations_total,
    donations_count,
    campaigns_supported,
    last_donation_at,
    volunteer_hours,
    volunteer_activities,
    volunteer_attendance_rate,
    current_opportunities,
    graatek_completed,
    graatek_shared,
    graatek_people_helped,
    graatek_completion_rate,
    ideas_created,
    ideas_supported,
    ideas_completed,
    ideas_participants,
    memories_created,
    memories_views,
    memories_reactions,
    memories_featured,
    badges,
    community_level,
    active_modules,
    last_updated
  ) values (
    p_user_id,
    v_donations_total,
    v_donations_count,
    v_campaigns_supported,
    v_last_donation_at,
    0,
    v_volunteer_activities,
    case when v_volunteer_activities > 0 then 100 else 0 end,
    v_current_opportunities,
    v_graatek_completed,
    v_graatek_shared,
    v_graatek_people_helped,
    v_graatek_completion_rate,
    v_ideas_created,
    v_ideas_supported,
    v_ideas_completed,
    v_ideas_participants,
    v_memories_created,
    0,
    v_memories_reactions,
    0,
    v_badges,
    v_level,
    v_active_modules,
    now()
  )
  on conflict (user_id) do update set
    donations_total = excluded.donations_total,
    donations_count = excluded.donations_count,
    campaigns_supported = excluded.campaigns_supported,
    last_donation_at = excluded.last_donation_at,
    volunteer_hours = excluded.volunteer_hours,
    volunteer_activities = excluded.volunteer_activities,
    volunteer_attendance_rate = excluded.volunteer_attendance_rate,
    current_opportunities = excluded.current_opportunities,
    graatek_completed = excluded.graatek_completed,
    graatek_shared = excluded.graatek_shared,
    graatek_people_helped = excluded.graatek_people_helped,
    graatek_completion_rate = excluded.graatek_completion_rate,
    ideas_created = excluded.ideas_created,
    ideas_supported = excluded.ideas_supported,
    ideas_completed = excluded.ideas_completed,
    ideas_participants = excluded.ideas_participants,
    memories_created = excluded.memories_created,
    memories_views = excluded.memories_views,
    memories_reactions = excluded.memories_reactions,
    memories_featured = excluded.memories_featured,
    badges = excluded.badges,
    community_level = excluded.community_level,
    active_modules = excluded.active_modules,
    last_updated = now();
end;
$$;

create or replace function public.refresh_community_impact_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_user_id uuid;
  v_new_user_id uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old_user_id := coalesce(
      nullif(to_jsonb(old)->>'contributor_id', '')::uuid,
      nullif(to_jsonb(old)->>'owner_id', '')::uuid,
      nullif(to_jsonb(old)->>'author_id', '')::uuid,
      nullif(to_jsonb(old)->>'user_id', '')::uuid
    );
    perform public.refresh_community_impact_for_user(v_old_user_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    v_new_user_id := coalesce(
      nullif(to_jsonb(new)->>'contributor_id', '')::uuid,
      nullif(to_jsonb(new)->>'owner_id', '')::uuid,
      nullif(to_jsonb(new)->>'author_id', '')::uuid,
      nullif(to_jsonb(new)->>'user_id', '')::uuid
    );
    perform public.refresh_community_impact_for_user(v_new_user_id);
    return new;
  end if;

  return old;
end;
$$;

do $$
begin
  if to_regclass('public.support_contributions') is not null then
    drop trigger if exists trg_community_impact_support_contributions on public.support_contributions;
    create trigger trg_community_impact_support_contributions
      after insert or update or delete on public.support_contributions
      for each row execute function public.refresh_community_impact_trigger();
  end if;

  if to_regclass('public.community_shares') is not null then
    drop trigger if exists trg_community_impact_community_shares on public.community_shares;
    create trigger trg_community_impact_community_shares
      after insert or update or delete on public.community_shares
      for each row execute function public.refresh_community_impact_trigger();
  end if;
end;
$$;

create or replace function public.refresh_community_impact_from_graatek_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_requester_id uuid;
  v_share_id uuid;
begin
  if tg_op = 'DELETE' then
    v_share_id := old.share_id;
    v_requester_id := old.requester_id;
  else
    v_share_id := new.share_id;
    v_requester_id := new.requester_id;
  end if;

  select owner_id into v_owner_id
  from public.community_shares
  where id = v_share_id;

  perform public.refresh_community_impact_for_user(v_owner_id);
  perform public.refresh_community_impact_for_user(v_requester_id);

  if tg_op in ('INSERT', 'UPDATE') then
    return new;
  end if;

  return old;
end;
$$;

do $$
begin
  if to_regclass('public.community_share_requests') is not null then
    drop trigger if exists trg_community_impact_community_share_requests on public.community_share_requests;
    create trigger trg_community_impact_community_share_requests
      after insert or update or delete on public.community_share_requests
      for each row execute function public.refresh_community_impact_from_graatek_request();
  end if;

  if to_regclass('public.ideas') is not null then
    drop trigger if exists trg_community_impact_ideas on public.ideas;
    create trigger trg_community_impact_ideas
      after insert or update or delete on public.ideas
      for each row execute function public.refresh_community_impact_trigger();
  end if;

  if to_regclass('public.memories') is not null then
    drop trigger if exists trg_community_impact_memories on public.memories;
    create trigger trg_community_impact_memories
      after insert or update or delete on public.memories
      for each row execute function public.refresh_community_impact_trigger();
  end if;
end;
$$;

create or replace function public.refresh_community_impact_from_idea_relation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
  v_idea_id uuid;
begin
  if tg_op = 'DELETE' then
    v_idea_id := old.idea_id;
  else
    v_idea_id := new.idea_id;
  end if;

  select author_id into v_author_id
  from public.ideas
  where id = v_idea_id;

  perform public.refresh_community_impact_for_user(v_author_id);

  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_community_impact_for_user(old.user_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_community_impact_for_user(new.user_id);
    return new;
  end if;

  return old;
end;
$$;

do $$
begin
  if to_regclass('public.idea_participants') is not null then
    drop trigger if exists trg_community_impact_idea_participants on public.idea_participants;
    create trigger trg_community_impact_idea_participants
      after insert or update or delete on public.idea_participants
      for each row execute function public.refresh_community_impact_from_idea_relation();
  end if;

  if to_regclass('public.idea_supporters') is not null then
    drop trigger if exists trg_community_impact_idea_supporters on public.idea_supporters;
    create trigger trg_community_impact_idea_supporters
      after insert or update or delete on public.idea_supporters
      for each row execute function public.refresh_community_impact_from_idea_relation();
  end if;
end;
$$;

create or replace function public.refresh_all_community_impact()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_count integer := 0;
begin
  for v_profile in select id from public.profiles loop
    perform public.refresh_community_impact_for_user(v_profile.id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.refresh_community_impact_for_user(uuid) to authenticated;
revoke all on function public.refresh_all_community_impact() from public, anon, authenticated;
