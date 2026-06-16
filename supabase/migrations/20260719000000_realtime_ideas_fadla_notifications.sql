-- Ensure all realtime UX tables are part of the Supabase realtime publication.
-- The guards keep this safe when earlier migrations already added a table.
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

alter table if exists public.idea_supporters replica identity full;
alter table if exists public.idea_participants replica identity full;
alter table if exists public.community_share_requests replica identity full;
alter table if exists public.notifications replica identity full;
