-- Add reaction_type to post_likes for LinkedIn-style multi-reactions
alter table public.post_likes
add column reaction_type text not null default 'like'
  check (reaction_type in ('like', 'love', 'laugh', 'surprise', 'sad', 'celebrate'));

-- Update the sync trigger function to also handle UPDATE
-- (when changing reaction type, count stays the same, but we update the post's updated_at)
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1, updated_at = now() where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0), updated_at = now() where id = old.post_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update public.posts set updated_at = now() where id = new.post_id;
    return new;
  end if;
  return null;
end;
$$;
