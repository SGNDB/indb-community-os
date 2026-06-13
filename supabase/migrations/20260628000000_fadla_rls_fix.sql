-- ============================================================
-- FADLA RLS FIX: Allow requests for 'published' OR 'requested'
-- Multiple users should be able to request the same item.
-- Only the first request changes status from published → requested.
--
-- IMPORTANT: The duplicate check (not exists on same table)
-- is NOT in RLS because it causes infinite recursion.
-- Duplicate protection is handled by:
--   - unique(share_id, requester_id) constraint
--   - server action's pending request check
--   - server action's 23505 error handler
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
  );
