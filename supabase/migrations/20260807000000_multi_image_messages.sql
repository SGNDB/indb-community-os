alter table public.conversation_messages
  add column if not exists image_urls jsonb default '[]'::jsonb,
  add column if not exists image_storage_paths jsonb default '[]'::jsonb;

alter table public.conversation_messages
  drop constraint if exists conversation_messages_payload_check;

alter table public.conversation_messages
  add constraint conversation_messages_payload_check
    check (
      (message_type = 'text' and coalesce(length(trim(message)), 0) > 0 and length(message) <= 1000)
      or
      (message_type = 'image' and image_url is not null and image_storage_path is not null and coalesce(length(message), 0) <= 500)
      or
      (message_type = 'image' and image_urls is not null and jsonb_array_length(image_urls) > 0 and coalesce(length(message), 0) <= 500)
    );
