-- Post comments
drop policy if exists "comments_update_owner_or_admin" on public.comments;
drop policy if exists "comments_delete_owner_or_admin" on public.comments;
drop policy if exists "comments_update_author" on public.comments;
create policy "comments_update_author" on public.comments
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "comments_delete_author_or_post_owner" on public.comments;
create policy "comments_delete_author_or_post_owner" on public.comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.posts
      where posts.id = comments.post_id
        and posts.author_id = auth.uid()
    )
  );

-- Idea comments
drop policy if exists "Moderators and admins can manage idea comments" on public.idea_comments;
drop policy if exists "Users can delete their own idea comments" on public.idea_comments;
drop policy if exists "idea_comments_update_author" on public.idea_comments;
create policy "idea_comments_update_author" on public.idea_comments
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "idea_comments_delete_author_or_idea_owner" on public.idea_comments;
create policy "idea_comments_delete_author_or_idea_owner" on public.idea_comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.ideas
      where ideas.id = idea_comments.idea_id
        and ideas.author_id = auth.uid()
    )
  );

-- Memory comments
drop policy if exists "memory_comments_delete_own" on public.memory_comments;
drop policy if exists "memory_comments_update_author" on public.memory_comments;
create policy "memory_comments_update_author" on public.memory_comments
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "memory_comments_delete_author_or_memory_owner" on public.memory_comments;
create policy "memory_comments_delete_author_or_memory_owner" on public.memory_comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.memories
      where memories.id = memory_comments.memory_id
        and memories.contributor_id = auth.uid()
    )
  );
