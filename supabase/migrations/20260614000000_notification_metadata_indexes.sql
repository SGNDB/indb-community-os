alter table public.notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists notifications_user_read_created_idx
  on public.notifications(user_id, read, created_at desc);

create index if not exists notifications_entity_idx
  on public.notifications(entity_type, entity_id);

create index if not exists notifications_metadata_comment_idx
  on public.notifications using gin (metadata);
