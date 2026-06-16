-- ============================================================
-- IDEAS V2: Community project lifecycle
-- Adds participation, discussion, supporters, and new statuses
-- ============================================================

-- Drop old status constraint first so we can set new statuses freely
alter table public.ideas
  drop constraint if exists ideas_status_check;

-- Migrate existing statuses to new lifecycle values
update public.ideas
  set status = 'published'
  where status in ('submitted', 'rejected', 'under_review');

update public.ideas
  set status = 'in_progress'
  where status = 'accepted' ;

-- Add new status constraint
alter table public.ideas
  add constraint ideas_status_check
    check (status in ('published', 'interested', 'discussion', 'in_progress', 'completed', 'archived'));

-- New columns
alter table public.ideas
  add column if not exists supporters_count integer not null default 0;

alter table public.ideas
  add column if not exists participants_count integer not null default 0;

-- Idea participants (replaces idea_votes for participation)
create table if not exists public.idea_participants (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

-- Idea discussion messages (private to participants + owner)
create table if not exists public.idea_messages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) > 0 and char_length(message) <= 500),
  created_at timestamptz not null default now()
);

-- Idea supporters (new support action)
create table if not exists public.idea_supporters (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

-- Indexes
create index if not exists idx_idea_participants_idea
  on public.idea_participants(idea_id, status);

create index if not exists idx_idea_participants_user
  on public.idea_participants(user_id);

create index if not exists idx_idea_messages_idea
  on public.idea_messages(idea_id, created_at);

create index if not exists idx_idea_supporters_idea
  on public.idea_supporters(idea_id);

create index if not exists idx_idea_supporters_user
  on public.idea_supporters(idea_id, user_id);

-- Enable RLS
alter table public.idea_participants enable row level security;
alter table public.idea_messages enable row level security;
alter table public.idea_supporters enable row level security;

-- Idea_participants policies
drop policy if exists "Anyone can read participants" on public.idea_participants;
create policy "Anyone can read participants"
  on public.idea_participants for select
  using (true);

drop policy if exists "Users can request to participate" on public.idea_participants;
create policy "Users can request to participate"
  on public.idea_participants for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Owner can manage participants" on public.idea_participants;
create policy "Owner can manage participants"
  on public.idea_participants for update
  to authenticated
  using (
    exists (select 1 from public.ideas where id = idea_id and author_id = auth.uid())
  );

-- Idea_messages policies: participants + owner can read/write
drop policy if exists "Participants can read messages" on public.idea_messages;
create policy "Participants can read messages"
  on public.idea_messages for select
  to authenticated
  using (
    exists (select 1 from public.ideas where id = idea_id and author_id = auth.uid())
    or exists (
      select 1 from public.idea_participants
      where idea_id = idea_messages.idea_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

drop policy if exists "Participants can insert messages" on public.idea_messages;
create policy "Participants can insert messages"
  on public.idea_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      exists (select 1 from public.ideas where id = idea_id and author_id = auth.uid())
      or exists (
        select 1 from public.idea_participants
        where idea_id = idea_messages.idea_id
          and user_id = auth.uid()
          and status = 'accepted'
      )
    )
  );

-- Idea_supporters policies
drop policy if exists "Anyone can read supporters" on public.idea_supporters;
create policy "Anyone can read supporters"
  on public.idea_supporters for select
  using (true);

drop policy if exists "Users can toggle own support" on public.idea_supporters;
create policy "Users can toggle own support"
  on public.idea_supporters for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can remove own support" on public.idea_supporters;
create policy "Users can remove own support"
  on public.idea_supporters for delete
  to authenticated
  using (user_id = auth.uid());

-- Enable realtime for new tables
alter publication supabase_realtime add table public.idea_participants;
alter publication supabase_realtime add table public.idea_messages;
