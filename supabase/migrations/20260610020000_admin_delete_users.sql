create or replace function public.admin_delete_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_admin_id uuid := auth.uid();
begin
  if not public.is_strict_admin(current_admin_id) then
    raise exception 'Only admins can delete profiles';
  end if;

  if target_user_id is null then
    raise exception 'Target profile is required';
  end if;

  if target_user_id = current_admin_id then
    raise exception 'Admins cannot delete their own profile from the dashboard';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Profile not found';
  end if;

  update public.community_credits
  set awarded_by = null
  where awarded_by = target_user_id;

  delete from public.notifications
  where user_id = target_user_id
     or actor_id = target_user_id;

  delete from public.profiles
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_profile(uuid) to authenticated;
