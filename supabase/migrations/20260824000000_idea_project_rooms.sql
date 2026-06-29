alter table public.conversations
  drop constraint if exists conversations_type_check;

alter table public.conversations
  add constraint conversations_type_check
  check (type in ('graatek', 'idea', 'direct', 'idea_project_room'));

drop index if exists public.idx_conv_idea;
drop index if exists public.idx_conversations_idea_project_room_unique;

create unique index if not exists idx_conversations_type_idea
  on public.conversations(type, idea_id)
  where idea_id is not null;

create index if not exists idx_conversations_type_idea_lookup
  on public.conversations(type, idea_id);

create index if not exists idx_conversation_messages_conv_created_sender
  on public.conversation_messages(conversation_id, created_at desc, sender_id);

create index if not exists idx_conversation_participants_conv_user_active
  on public.conversation_participants(conversation_id, user_id)
  where left_at is null and removed_at is null;

create or replace function public.join_idea_project_room(p_idea_id uuid, p_user_id uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_owner_id uuid;
  v_title text;
  v_image_url text;
  v_is_allowed boolean;
begin
  if p_user_id is null or auth.uid() is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select i.author_id, i.title, i.image_url
    into v_owner_id, v_title, v_image_url
  from public.ideas i
  where i.id = p_idea_id;

  if v_owner_id is null then
    raise exception 'not_found';
  end if;

  v_is_allowed :=
    v_owner_id = p_user_id
    or public.is_admin(p_user_id)
    or exists (
      select 1
      from public.idea_votes iv
      where iv.idea_id = p_idea_id
        and iv.user_id = p_user_id
    );

  if not v_is_allowed then
    raise exception 'vote_required';
  end if;

  select c.id
    into v_conv_id
  from public.conversations c
  where c.type = 'idea_project_room'
    and c.idea_id = p_idea_id
  limit 1;

  if v_conv_id is null then
    insert into public.conversations (type, idea_id, title, image_url)
    values ('idea_project_room', p_idea_id, coalesce(v_title, ''), v_image_url)
    returning id into v_conv_id;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, role, left_at, removed_at, removed_by)
  values (v_conv_id, v_owner_id, 'admin', null, null, null)
  on conflict (conversation_id, user_id)
  do update set
    role = 'admin',
    left_at = null,
    removed_at = null,
    removed_by = null;

  insert into public.conversation_participants (conversation_id, user_id, role, left_at, removed_at, removed_by)
  values (v_conv_id, p_user_id, case when p_user_id = v_owner_id then 'admin' else 'member' end, null, null, null)
  on conflict (conversation_id, user_id)
  do update set
    role = case when excluded.user_id = v_owner_id then 'admin' else public.conversation_participants.role end,
    left_at = null,
    removed_at = null,
    removed_by = null;

  update public.conversations
     set updated_at = now()
   where id = v_conv_id;

  return v_conv_id;
end;
$$;

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
        public.is_admin(p_user_id)
        or exists (
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
      and (
        public.is_admin(p_user_id)
        or exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = c.id
            and cp.user_id = p_user_id
            and cp.left_at is null
            and cp.removed_at is null
        )
      )
      and (
        c.type <> 'direct'
        or exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = c.id
            and cp.user_id <> p_user_id
            and cp.left_at is null
            and cp.removed_at is null
            and public.can_direct_message_users(p_user_id, cp.user_id)
        )
      )
  );
$$;

grant execute on function public.join_idea_project_room(uuid, uuid) to authenticated;
grant execute on function public.can_access_conversation(uuid, uuid) to authenticated;
grant execute on function public.can_send_to_conversation(uuid, uuid) to authenticated;
