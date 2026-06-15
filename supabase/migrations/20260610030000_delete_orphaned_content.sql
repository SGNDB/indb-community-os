begin;

delete from public.comments
where author_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = comments.author_id
  );

delete from public.idea_comments
where author_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = idea_comments.author_id
  );

delete from public.memory_comments
where author_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = memory_comments.author_id
  );

delete from public.posts
where author_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = posts.author_id
  );

delete from public.ideas
where author_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = ideas.author_id
  );

delete from public.memories
where contributor_id is null
   or not exists (
    select 1 from public.profiles where profiles.id = memories.contributor_id
  );

commit;
