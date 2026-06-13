-- ============================================================
-- FIX MEMORY TIMELINE YEAR FILTER
-- Removes strict year requirement from timeline RPC functions
-- to match main Memory page visibility logic
-- ============================================================

-- Backfill decade for memories that have year but no decade
update public.memories
set decade = (floor(year / 10) * 10)::text || 's'
where year is not null
  and (decade is null or decade = '');
