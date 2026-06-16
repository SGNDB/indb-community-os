-- Keep share counters accurate under concurrent shares.
-- This intentionally supports only public share targets used by the app.
create or replace function public.increment_share_count(
  p_entity_type text,
  p_entity_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  if auth.uid() is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if p_entity_type = 'post' then
    update public.posts
       set shares_count = coalesce(shares_count, 0) + 1
     where id = p_entity_id
       and (
         status = 'published'
         or author_id = auth.uid()
         or public.is_admin(auth.uid())
       )
     returning shares_count into v_new_count;
  elsif p_entity_type = 'memory' then
    update public.memories
       set shares_count = coalesce(shares_count, 0) + 1
     where id = p_entity_id
       and (
         verification_status = 'approved'
         or contributor_id = auth.uid()
         or public.is_admin(auth.uid())
       )
     returning shares_count into v_new_count;
  else
    raise exception 'unsupported share entity type: %', p_entity_type using errcode = '22023';
  end if;

  if v_new_count is null then
    raise exception 'share target not found' using errcode = 'P0002';
  end if;

  return v_new_count;
end;
$$;

revoke all on function public.increment_share_count(text, uuid) from public;
grant execute on function public.increment_share_count(text, uuid) to authenticated;
