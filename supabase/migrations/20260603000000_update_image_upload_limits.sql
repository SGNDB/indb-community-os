insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-covers', 'profile-covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('memory-archive', 'memory-archive', true, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
