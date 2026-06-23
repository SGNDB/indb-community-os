-- Idea-based private group chats.
-- No public/global chats: conversations remain scoped to Graatek or Ideas.

alter table public.conversations
  add column if not exists image_url text,
  add column if not exists image_storage_path text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.conversation_participants
  add column if not exists role text not null default 'member',
  add column if not exists left_at timestamptz,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid references public.profiles(id) on delete set null;

alter table public.conversation_participants
  drop constraint if exists conversation_participants_role_check;

alter table public.conversation_participants
  add constraint conversation_participants_role_check
    check (role in ('admin', 'member'));

alter table public.conversation_messages
  add column if not exists message_type text not null default 'text',
  add column if not exists image_url text,
  add column if not exists image_storage_path text;

alter table public.conversation_messages
  alter column message drop not null;

alter table public.conversation_messages
  drop constraint if exists conversation_messages_type_check;

alter table public.conversation_messages
  add constraint conversation_messages_type_check
    check (message_type in ('text', 'image'));

alter table public.conversation_messages
  drop constraint if exists conversation_messages_payload_check;

alter table public.conversation_messages
  add constraint conversation_messages_payload_check
    check (
      (message_type = 'text' and coalesce(length(trim(message)), 0) > 0 and length(message) <= 1000)
      or
      (message_type = 'image' and image_url is not null and image_storage_path is not null and coalesce(length(message), 0) <= 500)
    );

create index if not exists idx_cp_conversation_active
  on public.conversation_participants(conversation_id, user_id)
  where left_at is null and removed_at is null;

create index if not exists idx_cp_role
  on public.conversation_participants(conversation_id, role)
  where left_at is null and removed_at is null;

create index if not exists idx_cm_type
  on public.conversation_messages(conversation_id, message_type, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conversation-images',
  'conversation-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "conversation_images_public_read" on storage.objects;
create policy "conversation_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'conversation-images');

drop policy if exists "conversation_images_upload_own" on storage.objects;
create policy "conversation_images_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'conversation-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "conversation_images_delete_own" on storage.objects;
create policy "conversation_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'conversation-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.can_access_conversation(p_conv_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    left join public.ideas i on i.id = c.idea_id
    where c.id = p_conv_id
      and p_user_id is not null
      and (
        exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = c.id
            and cp.user_id = p_user_id
            and cp.left_at is null
            and cp.removed_at is null
        )
        or (
          c.type = 'idea'
          and (
            i.author_id = p_user_id
            or exists (
              select 1
              from public.idea_participants ip
              where ip.idea_id = c.idea_id
                and ip.user_id = p_user_id
                and ip.status = 'accepted'
            )
          )
          and not exists (
            select 1
            from public.conversation_participants blocked_cp
            where blocked_cp.conversation_id = c.id
              and blocked_cp.user_id = p_user_id
              and (
                blocked_cp.left_at is not null
                or blocked_cp.removed_at is not null
              )
          )
        )
      )
  );
$$;

create or replace function public.is_conversation_admin(p_conv_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    left join public.ideas i on i.id = c.idea_id
    left join public.conversation_participants cp
      on cp.conversation_id = c.id
     and cp.user_id = p_user_id
     and cp.left_at is null
     and cp.removed_at is null
    where c.id = p_conv_id
      and p_user_id is not null
      and (
        (c.type = 'idea' and i.author_id = p_user_id)
        or cp.role = 'admin'
      )
  );
$$;

create or replace function public.can_send_to_conversation(p_conv_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    left join public.ideas i on i.id = c.idea_id
    where c.id = p_conv_id
      and p_user_id is not null
      and c.archived_at is null
      and coalesce(i.status, 'published') not in ('completed', 'archived')
      and public.can_access_conversation(p_conv_id, p_user_id)
  );
$$;

drop policy if exists "conv_participants_select" on public.conversations;
drop policy if exists "conv_service_insert" on public.conversations;
drop policy if exists "conv_service_update" on public.conversations;
drop policy if exists "conversations_select_access" on public.conversations;
drop policy if exists "conversations_admin_update" on public.conversations;

create policy "conversations_select_access"
  on public.conversations for select
  to authenticated
  using (public.can_access_conversation(id, auth.uid()));

drop policy if exists "cp_select_own" on public.conversation_participants;
drop policy if exists "cp_update_own" on public.conversation_participants;
drop policy if exists "cp_service_insert" on public.conversation_participants;
drop policy if exists "conversation_participants_select_access" on public.conversation_participants;

create policy "conversation_participants_select_access"
  on public.conversation_participants for select
  to authenticated
  using (public.can_access_conversation(conversation_id, auth.uid()));

drop policy if exists "cm_participants_select" on public.conversation_messages;
drop policy if exists "cm_participants_insert_own" on public.conversation_messages;
drop policy if exists "cm_sender_update_read" on public.conversation_messages;
drop policy if exists "conversation_messages_select_access" on public.conversation_messages;
drop policy if exists "conversation_messages_insert_member" on public.conversation_messages;

create policy "conversation_messages_select_access"
  on public.conversation_messages for select
  to authenticated
  using (public.can_access_conversation(conversation_id, auth.uid()));

create policy "conversation_messages_insert_member"
  on public.conversation_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_send_to_conversation(conversation_id, auth.uid())
  );

create or replace function public.ensure_idea_conversation(p_idea_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_author_id uuid;
  v_title text;
  v_image_url text;
  v_status text;
begin
  select author_id, coalesce(title, ''), image_url, status
    into v_author_id, v_title, v_image_url, v_status
  from public.ideas
  where id = p_idea_id;

  if v_author_id is null then
    raise exception 'Idea % not found', p_idea_id;
  end if;

  select id into v_conv_id
  from public.conversations
  where idea_id = p_idea_id
  limit 1;

  if v_conv_id is null then
    insert into public.conversations (type, idea_id, title, image_url, archived_at)
    values (
      'idea',
      p_idea_id,
      v_title,
      v_image_url,
      case when v_status in ('completed', 'archived') then now() else null end
    )
    returning id into v_conv_id;
  else
    update public.conversations
       set title = coalesce(nullif(title, ''), v_title),
           image_url = coalesce(image_url, v_image_url),
           archived_at = case
             when v_status in ('completed', 'archived') then coalesce(archived_at, now())
             else archived_at
           end,
           updated_at = now()
     where id = v_conv_id;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, role, left_at, removed_at)
  values (v_conv_id, v_author_id, 'admin', null, null)
  on conflict (conversation_id, user_id) do update
    set role = 'admin',
        left_at = null,
        removed_at = null,
        removed_by = null;

  insert into public.conversation_participants (conversation_id, user_id, role, left_at, removed_at)
  select v_conv_id, ip.user_id, 'member', null, null
  from public.idea_participants ip
  where ip.idea_id = p_idea_id
    and ip.status = 'accepted'
  on conflict (conversation_id, user_id) do update
    set role = case when public.conversation_participants.role = 'admin' then 'admin' else 'member' end,
        left_at = null,
        removed_at = null,
        removed_by = null;

  return v_conv_id;
end;
$$;

create or replace function public.add_conversation_participant(p_conv_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
  v_idea_id uuid;
  v_is_author boolean;
  v_is_accepted boolean;
begin
  select c.type, c.idea_id, exists(select 1 from public.ideas i where i.id = c.idea_id and i.author_id = p_user_id)
    into v_type, v_idea_id, v_is_author
  from public.conversations c
  where c.id = p_conv_id;

  if v_type = 'idea' then
    select exists (
      select 1
      from public.idea_participants ip
      where ip.idea_id = v_idea_id
        and ip.user_id = p_user_id
        and ip.status = 'accepted'
    ) into v_is_accepted;

    if not coalesce(v_is_author, false) and not coalesce(v_is_accepted, false) then
      raise exception 'User % is not accepted for idea conversation %', p_user_id, p_conv_id;
    end if;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, role, left_at, removed_at)
  values (p_conv_id, p_user_id, case when coalesce(v_is_author, false) then 'admin' else 'member' end, null, null)
  on conflict (conversation_id, user_id) do update
    set role = case when coalesce(v_is_author, false) then 'admin' else public.conversation_participants.role end,
        left_at = null,
        removed_at = null,
        removed_by = null;
end;
$$;

create or replace function public.update_idea_group_profile(
  p_conv_id uuid,
  p_actor_id uuid,
  p_title text,
  p_image_url text,
  p_image_storage_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_admin(p_conv_id, p_actor_id) then
    raise exception 'not_allowed';
  end if;

  update public.conversations
     set title = coalesce(nullif(trim(p_title), ''), title),
         image_url = coalesce(p_image_url, image_url),
         image_storage_path = coalesce(p_image_storage_path, image_storage_path),
         updated_at = now()
   where id = p_conv_id
     and type = 'idea';
end;
$$;

create or replace function public.remove_idea_group_member(
  p_conv_id uuid,
  p_actor_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_admin(p_conv_id, p_actor_id) then
    raise exception 'not_allowed';
  end if;

  if public.is_conversation_admin(p_conv_id, p_user_id) then
    raise exception 'cannot_remove_admin';
  end if;

  update public.conversation_participants
     set removed_at = now(),
         removed_by = p_actor_id,
         left_at = null
   where conversation_id = p_conv_id
     and user_id = p_user_id
     and role <> 'admin';
end;
$$;

create or replace function public.leave_idea_group(
  p_conv_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_conversation_admin(p_conv_id, p_user_id) then
    raise exception 'admin_cannot_leave';
  end if;

  update public.conversation_participants
     set left_at = now()
   where conversation_id = p_conv_id
     and user_id = p_user_id
     and role = 'member';
end;
$$;

create or replace function public.mark_conversation_read(p_conv_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_access_conversation(p_conv_id, p_user_id) then
    raise exception 'not_allowed';
  end if;

  update public.conversation_participants
     set last_read_at = now(),
         unread_count = 0
   where conversation_id = p_conv_id
     and user_id = p_user_id;
end;
$$;

create or replace function public.archive_conversation(p_conv_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set archived_at = now(),
         updated_at = now()
   where id = p_conv_id;
end;
$$;

create or replace function public.increment_conv_unread(p_conv_id uuid, p_except_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_participants
     set unread_count = unread_count + 1
   where conversation_id = p_conv_id
     and user_id <> p_except_user
     and left_at is null
     and removed_at is null;
end;
$$;

create or replace function public.get_user_inbox(p_user_id uuid)
returns table(
  id uuid,
  type text,
  graatek_id uuid,
  idea_id uuid,
  title text,
  image_url text,
  image_storage_path text,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  idea_title text,
  idea_status text,
  member_count bigint,
  last_message_text text,
  last_message_type text,
  last_message_image_url text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint,
  other_user_id uuid,
  other_username text,
  other_full_name text,
  other_avatar_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  with my_participations as (
    select cp.conversation_id, cp.unread_count, cp.last_read_at
    from public.conversation_participants cp
    where cp.user_id = p_user_id
      and cp.left_at is null
      and cp.removed_at is null
  ),
  latest_messages as (
    select distinct on (cm.conversation_id)
      cm.conversation_id,
      cm.message as last_message_text,
      cm.message_type as last_message_type,
      cm.image_url as last_message_image_url,
      cm.created_at as last_message_at,
      cm.sender_id as last_message_sender_id
    from public.conversation_messages cm
    order by cm.conversation_id, cm.created_at desc
  ),
  other_participant as (
    select distinct on (cp.conversation_id)
      cp.conversation_id,
      cp.user_id as other_user_id,
      p.username as other_username,
      p.full_name as other_full_name,
      p.avatar_url as other_avatar_url
    from public.conversation_participants cp
    left join public.profiles p on p.id = cp.user_id
    where cp.user_id <> p_user_id
      and cp.left_at is null
      and cp.removed_at is null
    order by cp.conversation_id, cp.created_at asc
  ),
  member_counts as (
    select cp.conversation_id, count(*)::bigint as member_count
    from public.conversation_participants cp
    where cp.left_at is null
      and cp.removed_at is null
    group by cp.conversation_id
  )
  select
    c.id,
    c.type,
    c.graatek_id,
    c.idea_id,
    c.title,
    c.image_url,
    c.image_storage_path,
    c.archived_at,
    c.created_at,
    c.updated_at,
    i.title as idea_title,
    i.status as idea_status,
    coalesce(mc.member_count, 0) as member_count,
    lm.last_message_text,
    lm.last_message_type,
    lm.last_message_image_url,
    lm.last_message_at,
    lm.last_message_sender_id,
    mp.unread_count::bigint,
    op.other_user_id,
    op.other_username,
    op.other_full_name,
    op.other_avatar_url
  from my_participations mp
  join public.conversations c on c.id = mp.conversation_id
  left join public.ideas i on i.id = c.idea_id
  left join latest_messages lm on lm.conversation_id = c.id
  left join other_participant op on op.conversation_id = c.id
  left join member_counts mc on mc.conversation_id = c.id
  order by coalesce(lm.last_message_at, c.updated_at, c.created_at) desc;
end;
$$;

create or replace function public.sync_idea_group_on_idea_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_idea_conversation(new.id);
  return new;
end;
$$;

drop trigger if exists trg_idea_group_on_idea_insert on public.ideas;
create trigger trg_idea_group_on_idea_insert
  after insert on public.ideas
  for each row execute function public.sync_idea_group_on_idea_insert();

create or replace function public.sync_idea_group_on_participant_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
begin
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    v_conv_id := public.ensure_idea_conversation(new.idea_id);
    perform public.add_conversation_participant(v_conv_id, new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_idea_group_on_participant_insert_update on public.idea_participants;
create trigger trg_idea_group_on_participant_insert_update
  after insert or update on public.idea_participants
  for each row execute function public.sync_idea_group_on_participant_update();

create or replace function public.sync_idea_group_on_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
begin
  if new.status in ('completed', 'archived') and old.status is distinct from new.status then
    select id into v_conv_id from public.conversations where idea_id = new.id limit 1;
    if v_conv_id is not null then
      perform public.archive_conversation(v_conv_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_idea_group_on_status_update on public.ideas;
create trigger trg_idea_group_on_status_update
  after update of status on public.ideas
  for each row execute function public.sync_idea_group_on_status_update();

-- Backfill all existing ideas so every idea has a prepared private group.
do $$
declare
  v_idea record;
begin
  for v_idea in (select id from public.ideas)
  loop
    perform public.ensure_idea_conversation(v_idea.id);
  end loop;
end $$;
