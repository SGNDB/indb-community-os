-- Remove estimated volunteer hours from community impact aggregates.
-- Volunteer hours must come from confirmed attendance-hour records, not inferred activity counts.

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

do $$
begin
  if to_regclass('public.community_impact_stats') is not null then
    update public.community_impact_stats
    set volunteer_hours = 0,
        last_updated = now()
    where volunteer_hours <> 0;
  end if;
end;
$$;
