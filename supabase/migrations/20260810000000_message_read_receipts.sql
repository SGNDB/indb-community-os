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

  update public.conversation_messages
     set read_at = coalesce(read_at, now())
   where conversation_id = p_conv_id
     and sender_id <> p_user_id
     and read_at is null;
end;
$$;

grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;
