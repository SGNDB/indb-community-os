-- ============================================================
-- POST REACTIONS (replaces post_likes for multi-reaction support)
-- ============================================================
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'support', 'celebrate', 'insightful', 'sad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.post_reactions enable row level security;

-- RLS policies
drop policy if exists "post_reactions_public_read" on public.post_reactions;
create policy "post_reactions_public_read" on public.post_reactions
  for select using (true);

drop policy if exists "post_reactions_insert_own" on public.post_reactions;
create policy "post_reactions_insert_own" on public.post_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "post_reactions_update_own" on public.post_reactions;
create policy "post_reactions_update_own" on public.post_reactions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "post_reactions_delete_own" on public.post_reactions;
create policy "post_reactions_delete_own" on public.post_reactions
  for delete using (auth.uid() = user_id);

-- Sync trigger for posts.likes_count
create or replace function public.sync_post_reactions_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1, updated_at = now() where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0), updated_at = now() where id = old.post_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update public.posts set updated_at = now() where id = new.post_id;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists post_reactions_count_trigger on public.post_reactions;
create trigger post_reactions_count_trigger
  after insert or delete or update on public.post_reactions
  for each row execute function public.sync_post_reactions_count();

-- Migrate existing data from post_likes
insert into public.post_reactions (post_id, user_id, reaction_type, created_at, updated_at)
select post_id, user_id, coalesce(reaction_type, 'like'), created_at, created_at
from public.post_likes
on conflict (post_id, user_id) do nothing;
