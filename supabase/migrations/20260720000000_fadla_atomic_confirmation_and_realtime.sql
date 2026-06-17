-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 20260720000000: Fadla Atomic Confirmation + Realtime Publication
-- ═══════════════════════════════════════════════════════════════════════════════
-- Instructions: Copy this entire file into Supabase Dashboard → SQL Editor
--   https://supabase.com/dashboard/project/oanwmlouezwtcirrhbyl/sql/new
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Atomic Fadla confirmation RPC: handles both receiver and sender confirmation
-- with row locking to prevent race conditions on two-sided completion.
create or replace function public.confirm_fadla_action(
  p_share_id uuid,
  p_user_id uuid,
  p_confirmation_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share record;
  v_request record;
  v_now timestamptz := now();
  v_receiver_confirmed_at timestamptz;
  v_sender_confirmed_at timestamptz;
  v_new_status text;
  v_both_confirmed boolean;
  v_notif_type text;
begin
  -- Lock the share row to prevent concurrent confirmations
  select * into v_share
  from public.community_shares
  where id = p_share_id
  for update;

  if v_share is null then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;

  if v_share.status = 'completed' then
    return jsonb_build_object('success', false, 'error', 'already_completed');
  end if;

  if v_share.accepted_request_id is null then
    return jsonb_build_object('success', false, 'error', 'no_accepted_request');
  end if;

  if p_confirmation_type = 'received' then
    -- Only the accepted requester can confirm received
    select * into v_request
    from public.community_share_requests
    where id = v_share.accepted_request_id and status = 'accepted';

    if v_request is null or v_request.requester_id != p_user_id then
      return jsonb_build_object('success', false, 'error', 'unauthorized');
    end if;

    if v_share.receiver_confirmed_at is not null then
      return jsonb_build_object('success', false, 'error', 'already_confirmed');
    end if;

    update public.community_shares
    set receiver_confirmed_at = v_now, updated_at = v_now
    where id = p_share_id;

    v_receiver_confirmed_at := v_now;
    v_sender_confirmed_at := v_share.sender_confirmed_at;
    v_notif_type := 'fadla_receiver_confirmed';

  elsif p_confirmation_type = 'handed_over' then
    -- Only the owner can confirm handed over
    if v_share.owner_id != p_user_id then
      return jsonb_build_object('success', false, 'error', 'unauthorized');
    end if;

    if v_share.sender_confirmed_at is not null then
      return jsonb_build_object('success', false, 'error', 'already_confirmed');
    end if;

    update public.community_shares
    set sender_confirmed_at = v_now, updated_at = v_now
    where id = p_share_id;

    v_receiver_confirmed_at := v_share.receiver_confirmed_at;
    v_sender_confirmed_at := v_now;
    v_notif_type := 'fadla_sender_confirmed';

  else
    return jsonb_build_object('success', false, 'error', 'invalid_confirmation_type');
  end if;

  -- Check if both sides have now confirmed
  v_both_confirmed := v_receiver_confirmed_at is not null and v_sender_confirmed_at is not null;

  if v_both_confirmed then
    update public.community_shares
    set status = 'completed', completed_at = v_now, updated_at = v_now
    where id = p_share_id;

    v_new_status := 'completed';
  else
    v_new_status := v_share.status;
  end if;

  return jsonb_build_object(
    'success', true,
    'shareId', p_share_id,
    'ownerId', v_share.owner_id,
    'receiverConfirmedAt', v_receiver_confirmed_at,
    'senderConfirmedAt', v_sender_confirmed_at,
    'shareStatus', v_new_status,
    'bothConfirmed', v_both_confirmed,
    'notificationType', v_notif_type
  );
end;
$$;

revoke all on function public.confirm_fadla_action(uuid, uuid, text) from public;
grant execute on function public.confirm_fadla_action(uuid, uuid, text) to authenticated;

-- 2. Ensure all realtime UX tables are part of the Supabase realtime publication
do $$
declare
  realtime_table_name text;
  realtime_tables text[] := array[
    'ideas',
    'idea_supporters',
    'idea_participants',
    'idea_messages',
    'community_shares',
    'community_share_requests',
    'fadla_request_messages',
    'notifications'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach realtime_table_name in array realtime_tables loop
    if to_regclass(format('public.%I', realtime_table_name)) is not null
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table_name
      ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table_name);
    end if;
  end loop;
end $$;

-- 3. Set REPLICA IDENTITY FULL on tables that need full old-row data in realtime events
alter table if exists public.idea_supporters replica identity full;
alter table if exists public.idea_participants replica identity full;
alter table if exists public.community_share_requests replica identity full;
alter table if exists public.notifications replica identity full;
