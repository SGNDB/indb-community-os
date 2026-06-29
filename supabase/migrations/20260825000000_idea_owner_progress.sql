alter table public.ideas
  add column if not exists progress_percentage integer not null default 0
  check (progress_percentage >= 0 and progress_percentage <= 100);

alter table public.ideas
  add column if not exists project_notes text;

create index if not exists idx_ideas_author_created
  on public.ideas(author_id, created_at desc);

create index if not exists idx_ideas_category_created
  on public.ideas(category_id, created_at desc);
