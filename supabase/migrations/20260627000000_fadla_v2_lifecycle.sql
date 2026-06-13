-- ============================================================
-- FADLA V2: Full Lifecycle Management
-- Adds: 6-status workflow, urgency, quantity, request mgmt,
--       collection flow, impact tracking
-- ============================================================

-- ============================================================
-- 1. ALTER community_shares: new columns + status constraint
-- ============================================================

alter table public.community_shares
  add column if not exists quantity int not null default 1,
  add column if not exists urgency_level text not null default 'no_urgency',
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Drop old status check, add new one matching 6-stage lifecycle
alter table public.community_shares
  drop constraint if exists community_shares_status_check;

alter table public.community_shares
  add constraint community_shares_status_check
    check (status in ('published', 'requested', 'reserved', 'collected', 'completed', 'archived'));

-- Default new items to 'published'
alter table public.community_shares
  alter column status set default 'published';

-- ============================================================
-- 2. ALTER community_share_requests: message + status
-- ============================================================

alter table public.community_share_requests
  add column if not exists message text,
  add column if not exists status text not null default 'pending',
  add column if not exists updated_at timestamptz not null default now();

alter table public.community_share_requests
  drop constraint if exists community_share_requests_status_check;

alter table public.community_share_requests
  add constraint community_share_requests_status_check
    check (status in ('pending', 'accepted', 'declined', 'cancelled'));

-- ============================================================
-- 3. INDEXES FOR SCALE
-- ============================================================

create index if not exists idx_community_shares_status_created
  on public.community_shares(status, created_at desc);

create index if not exists idx_community_shares_owner_status
  on public.community_shares(owner_id, status);

create index if not exists idx_community_shares_urgency
  on public.community_shares(urgency_level)
  where status = 'published';

create index if not exists idx_community_shares_category_status
  on public.community_shares(category, status);

create index if not exists idx_community_share_requests_share_status
  on public.community_share_requests(share_id, status);

create index if not exists idx_community_share_requests_requester_status
  on public.community_share_requests(requester_id, status);

-- ============================================================
-- 4. RPC: GET FADLA IMPACT STATS
-- ============================================================

create or replace function public.get_fadla_impact(p_user_id uuid)
returns table(
  people_helped bigint,
  items_shared bigint,
  completed_shares bigint
)
language sql
stable
as $$
  select
    coalesce(
      (select count(distinct cr.requester_id)
       from public.community_shares cs
       join public.community_share_requests cr on cr.share_id = cs.id
       where cs.owner_id = p_user_id
         and cs.status = 'completed'
         and cr.status = 'accepted'), 0
    ) as people_helped,
    coalesce(
      (select count(*)::bigint
       from public.community_shares
       where owner_id = p_user_id
         and status = 'completed'), 0
    ) as items_shared,
    coalesce(
      (select count(*)::bigint
       from public.community_shares
       where owner_id = p_user_id
         and status in ('completed', 'archived')), 0
    ) as completed_shares;
$$;

-- ============================================================
-- 5. UPDATE RLS POLICIES
-- ============================================================

-- Drop old request insert policy, recreate with new checks
drop policy if exists "Authenticated users can request shares" on public.community_share_requests;

create policy "Authenticated users can request shares"
  on public.community_share_requests for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and exists (
      select 1 from public.community_shares
      where community_shares.id = share_id
        and community_shares.owner_id <> auth.uid()
        and community_shares.status = 'published'
    )
    and not exists (
      select 1 from public.community_share_requests existing
      where existing.share_id = share_id
        and existing.requester_id = auth.uid()
        and existing.status = 'pending'
    )
  );

-- Only owner can update request status
drop policy if exists "Owner can update request status" on public.community_share_requests;

create policy "Owner can update request status"
  on public.community_share_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.community_shares
      where community_shares.id = share_id
        and community_shares.owner_id = auth.uid()
    )
  )
  with check (
    status in ('accepted', 'declined')
  );

-- Requester can cancel their own requests
drop policy if exists "Requester can cancel own requests" on public.community_share_requests;

create policy "Requester can cancel own requests"
  on public.community_share_requests for update
  to authenticated
  using (
    requester_id = auth.uid()
  )
  with check (
    status = 'cancelled'
  );
