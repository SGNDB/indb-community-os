alter table public.profiles add column if not exists cover_image_url text;

do $$
begin
  if not exists (
    select 1 from storage.buckets where name = 'profile-covers'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('profile-covers', 'profile-covers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']);
  end if;
end $$;
