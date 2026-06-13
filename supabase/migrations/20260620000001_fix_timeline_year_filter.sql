-- ============================================================
-- FIX MEMORY TIMELINE YEAR FILTER
-- Backfill years for existing memories that are missing them
-- ============================================================

-- DIAGNOSTIC QUERY (run this first to see what's wrong):
-- select id, title, year, decade, verification_status, contributor_id, created_at
-- from memories
-- order by created_at desc
-- limit 20;

-- If verification_status is not 'approved', memories won't show in timeline
-- Update memories to 'approved' if they are null or have a different status
-- (Only do this if you want all memories to be visible in timeline)
update public.memories
set verification_status = 'approved'
where verification_status is null
  or verification_status = 'pending'
  or verification_status = 'published';

-- Backfill year from created_at if year is null but memory has created_at
-- This uses the year from the created_at timestamp
update public.memories
set year = extract(year from created_at)
where year is null
  and created_at is not null
  and verification_status = 'approved'
  and contributor_id is not null;

-- Backfill decade for memories that have year but no decade
update public.memories
set decade = (floor(year / 10) * 10)::text || 's'
where year is not null
  and (decade is null or decade = '');
