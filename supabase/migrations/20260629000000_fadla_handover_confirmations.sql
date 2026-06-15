-- ============================================================
-- FADLA: Recipient + owner handover confirmations
-- Keeps reserved items visible until both sides confirm handover,
-- then allows the owner to complete and archive the item.
-- ============================================================

alter table public.community_shares
  add column if not exists accepted_request_id uuid references public.community_share_requests(id) on delete set null;

alter table public.community_share_requests
  add column if not exists collected_at timestamptz,
  add column if not exists handed_over_at timestamptz;

create index if not exists idx_community_shares_accepted_request
  on public.community_shares(accepted_request_id)
  where accepted_request_id is not null;

create index if not exists idx_community_share_requests_handover
  on public.community_share_requests(share_id, status, collected_at, handed_over_at);

-- Allow accepted requester to confirm collection (set collected_at)
drop policy if exists "Accepted requester can confirm collection" on public.community_share_requests;
create policy "Accepted requester can confirm collection"
  on public.community_share_requests for update
  to authenticated
  using (
    requester_id = auth.uid()
    and status = 'accepted'
  )
  with check (
    requester_id = auth.uid()
    and status = 'accepted'
  );

-- Allow owner to confirm handover (set handed_over_at) after collection
drop policy if exists "Owner can confirm handover after collection" on public.community_share_requests;
create policy "Owner can confirm handover after collection"
  on public.community_share_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.community_shares
      where community_shares.id = share_id
        and community_shares.owner_id = auth.uid()
    )
    and status = 'accepted'
  )
  with check (
    status = 'accepted'
  );
