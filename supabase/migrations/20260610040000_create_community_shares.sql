create table if not exists public.community_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  condition text,
  location text,
  status text not null default 'available',
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_shares_status_check check (status in ('available', 'reserved', 'given'))
);

create table if not exists public.community_share_requests (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.community_shares(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_share_requests_unique unique (share_id, requester_id)
);

create index if not exists community_shares_owner_idx on public.community_shares(owner_id);
create index if not exists community_shares_status_idx on public.community_shares(status);
create index if not exists community_shares_created_at_idx on public.community_shares(created_at desc);
create index if not exists community_share_requests_share_idx on public.community_share_requests(share_id);
create index if not exists community_share_requests_requester_idx on public.community_share_requests(requester_id);

alter table public.community_shares enable row level security;
alter table public.community_share_requests enable row level security;

drop policy if exists "Anyone can read community shares" on public.community_shares;
create policy "Anyone can read community shares"
  on public.community_shares for select
  using (true);

drop policy if exists "Users can create own community shares" on public.community_shares;
create policy "Users can create own community shares"
  on public.community_shares for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update own community shares" on public.community_shares;
create policy "Users can update own community shares"
  on public.community_shares for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete own community shares" on public.community_shares;
create policy "Users can delete own community shares"
  on public.community_shares for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Share owners and requesters can read requests" on public.community_share_requests;
create policy "Share owners and requesters can read requests"
  on public.community_share_requests for select
  to authenticated
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from public.community_shares
      where community_shares.id = share_id
        and community_shares.owner_id = auth.uid()
    )
  );

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
        and community_shares.status = 'available'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fadla-media',
  'fadla-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload fadla media" on storage.objects;
create policy "Authenticated users can upload fadla media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fadla-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view fadla media files" on storage.objects;
create policy "Anyone can view fadla media files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fadla-media');

drop policy if exists "Users can delete own fadla media files" on storage.objects;
create policy "Users can delete own fadla media files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fadla-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
