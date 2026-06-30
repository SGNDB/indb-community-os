create or replace function public.sync_idea_group_on_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv record;
begin
  if new.status in ('completed', 'archived') and old.status is distinct from new.status then
    for v_conv in
      select id
      from public.conversations
      where idea_id = new.id
        and type in ('idea', 'idea_project_room')
    loop
      perform public.archive_conversation(v_conv.id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_idea_group_on_status_update on public.ideas;
create trigger trg_idea_group_on_status_update
  after update of status on public.ideas
  for each row execute function public.sync_idea_group_on_status_update();

update public.conversations c
set archived_at = coalesce(c.archived_at, now()),
    updated_at = now()
from public.ideas i
where c.idea_id = i.id
  and c.type in ('idea', 'idea_project_room')
  and i.status in ('completed', 'archived')
  and c.archived_at is null;
