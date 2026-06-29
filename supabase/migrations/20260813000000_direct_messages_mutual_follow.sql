create or replace function public.can_direct_message_users(p_user1_id uuid, p_user2_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user1_id is not null
    and p_user2_id is not null
    and p_user1_id <> p_user2_id
    and exists (
      select 1
      from public.user_follows uf
      where uf.follower_id = p_user1_id
        and uf.following_id = p_user2_id
    )
    and exists (
      select 1
      from public.user_follows uf
      where uf.follower_id = p_user2_id
        and uf.following_id = p_user1_id
    );
$$;

create or replace function public.ensure_direct_conversation(p_user1_id uuid, p_user2_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
begin
  if auth.uid() is null or auth.uid() not in (p_user1_id, p_user2_id) then
    raise exception 'unauthorized';
  end if;

  if not public.can_direct_message_users(p_user1_id, p_user2_id) then
    raise exception 'direct_mutual_required';
  end if;

  v_conv_id := public.get_direct_conversation_id(p_user1_id, p_user2_id);
  if v_conv_id is not null then
    return v_conv_id;
  end if;

  insert into public.conversations (type, title)
  values ('direct', '')
  returning id into v_conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conv_id, p_user1_id), (v_conv_id, p_user2_id)
  on conflict do nothing;

  return v_conv_id;
end;
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

grant execute on function public.can_direct_message_users(uuid, uuid) to authenticated;
grant execute on function public.ensure_direct_conversation(uuid, uuid) to authenticated;
grant execute on function public.can_send_to_conversation(uuid, uuid) to authenticated;
