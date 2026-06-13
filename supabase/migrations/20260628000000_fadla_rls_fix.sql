-- ============================================================
-- FADLA RLS FIX: Allow requests for 'published' OR 'requested'
-- Multiple users should be able to request the same item.
-- Only the first request changes status from published → requested.
-- ============================================================

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
        and community_shares.status in ('published', 'requested')
    )
    and not exists (
      select 1 from public.community_share_requests existing
      where existing.share_id = share_id
        and existing.requester_id = auth.uid()
        and existing.status = 'pending'
    )
  );
