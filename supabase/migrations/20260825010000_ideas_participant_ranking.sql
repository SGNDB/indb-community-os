create index if not exists idx_ideas_participants_created
  on public.ideas(participants_count desc, created_at desc);
