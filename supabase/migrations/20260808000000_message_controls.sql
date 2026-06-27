-- Message controls: edit, soft delete, and delivery/read receipt support.

alter table public.conversation_messages
  add column if not exists is_edited boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edit_history jsonb not null default '[]'::jsonb,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists conversation_messages_deleted_idx
  on public.conversation_messages(conversation_id, is_deleted, created_at);

create table if not exists public.conversation_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.conversation_messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'message_report',
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create index if not exists conversation_message_reports_status_idx
  on public.conversation_message_reports(status, created_at desc);

alter table public.conversation_message_reports enable row level security;

drop policy if exists "conversation_message_reports_owner_read" on public.conversation_message_reports;
create policy "conversation_message_reports_owner_read"
  on public.conversation_message_reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "conversation_message_reports_owner_insert" on public.conversation_message_reports;
create policy "conversation_message_reports_owner_insert"
  on public.conversation_message_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

alter table public.conversation_messages
  drop constraint if exists conversation_messages_payload_check;

alter table public.conversation_messages
  add constraint conversation_messages_payload_check
    check (
      is_deleted = true
      or
      (message_type = 'text' and coalesce(length(trim(message)), 0) > 0 and length(message) <= 1000)
      or
      (message_type = 'image' and image_url is not null and image_storage_path is not null and coalesce(length(message), 0) <= 500)
      or
      (message_type = 'image' and image_urls is not null and jsonb_array_length(image_urls) > 0 and coalesce(length(message), 0) <= 500)
    );

create or replace function public.conversation_is_readonly(p_conv_id uuid)
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
      and (
        c.archived_at is not null
        or coalesce(i.status, '') in ('completed', 'archived')
      )
  );
$$;

create or replace function public.edit_conversation_message(
  p_message_id uuid,
  p_user_id uuid,
  p_message text
)
returns public.conversation_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.conversation_messages;
  v_clean text;
  v_max_length integer;
  v_result public.conversation_messages;
begin
  v_clean := trim(coalesce(p_message, ''));

  select *
    into v_message
  from public.conversation_messages
  where id = p_message_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_message.sender_id is distinct from p_user_id then
    raise exception 'not_allowed';
  end if;

  if v_message.is_deleted then
    raise exception 'deleted';
  end if;

  if not public.can_access_conversation(v_message.conversation_id, p_user_id) then
    raise exception 'not_allowed';
  end if;

  if public.conversation_is_readonly(v_message.conversation_id) then
    raise exception 'readonly';
  end if;

  v_max_length := case when v_message.message_type = 'image' then 500 else 1000 end;
  if length(v_clean) = 0 or length(v_clean) > v_max_length then
    raise exception 'invalid_message';
  end if;

  update public.conversation_messages
     set message = v_clean,
         is_edited = true,
         edited_at = now(),
         edit_history = coalesce(edit_history, '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object(
             'message', v_message.message,
             'edited_at', now()
           )
         )
   where id = p_message_id
   returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.delete_conversation_message(
  p_message_id uuid,
  p_user_id uuid
)
returns public.conversation_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.conversation_messages;
  v_result public.conversation_messages;
begin
  select *
    into v_message
  from public.conversation_messages
  where id = p_message_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_message.sender_id is distinct from p_user_id then
    raise exception 'not_allowed';
  end if;

  if v_message.is_deleted then
    return v_message;
  end if;

  if not public.can_access_conversation(v_message.conversation_id, p_user_id) then
    raise exception 'not_allowed';
  end if;

  if public.conversation_is_readonly(v_message.conversation_id) then
    raise exception 'readonly';
  end if;

  update public.conversation_messages
     set message = null,
         image_url = null,
         image_storage_path = null,
         image_urls = '[]'::jsonb,
         image_storage_paths = '[]'::jsonb,
         is_deleted = true,
         deleted_at = now(),
         deleted_by = p_user_id
   where id = p_message_id
   returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.report_conversation_message(
  p_message_id uuid,
  p_user_id uuid
)
returns public.conversation_message_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.conversation_messages;
  v_report public.conversation_message_reports;
begin
  select *
    into v_message
  from public.conversation_messages
  where id = p_message_id;

  if not found then
    raise exception 'not_found';
  end if;

  if v_message.sender_id = p_user_id then
    raise exception 'not_allowed';
  end if;

  if not public.can_access_conversation(v_message.conversation_id, p_user_id) then
    raise exception 'not_allowed';
  end if;

  insert into public.conversation_message_reports (message_id, conversation_id, reporter_id)
  values (p_message_id, v_message.conversation_id, p_user_id)
  on conflict (message_id, reporter_id)
  do update set created_at = now(), status = 'pending'
  returning * into v_report;

  return v_report;
end;
$$;

grant execute on function public.conversation_is_readonly(uuid) to authenticated;
grant execute on function public.edit_conversation_message(uuid, uuid, text) to authenticated;
grant execute on function public.delete_conversation_message(uuid, uuid) to authenticated;
grant execute on function public.report_conversation_message(uuid, uuid) to authenticated;
