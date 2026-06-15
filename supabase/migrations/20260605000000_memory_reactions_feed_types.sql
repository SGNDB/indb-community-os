-- Create memory_reactions table if not already present
create table if not exists public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (memory_id, user_id)
);

-- Drop old constraint (may not exist if table was just created)
alter table public.memory_reactions
drop constraint if exists memory_reactions_reaction_type_check;

-- Add new matching CHECK constraint for feed-style types
alter table public.memory_reactions
add constraint memory_reactions_reaction_type_check
check (reaction_type in ('like', 'love', 'support', 'celebrate', 'insightful', 'sad'));

-- Ensure RLS is enabled
alter table public.memory_reactions enable row level security;

-- Recreate policies idempotently
drop policy if exists "memory_reactions_public_read" on public.memory_reactions;
create policy "memory_reactions_public_read" on public.memory_reactions
  for select using (true);

drop policy if exists "memory_reactions_insert_own" on public.memory_reactions;
create policy "memory_reactions_insert_own" on public.memory_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "memory_reactions_update_own" on public.memory_reactions;
create policy "memory_reactions_update_own" on public.memory_reactions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "memory_reactions_delete_own" on public.memory_reactions;
create policy "memory_reactions_delete_own" on public.memory_reactions
  for delete using (auth.uid() = user_id);
