-- Manual support payment verification for local Mauritanian payment methods.
-- MVP: Bankily, Masrivi, Sedad are recorded as pending until an admin verifies.
-- Card payments must use a provider; raw card data is never stored here.

alter table if exists public.support_contributions
  add column if not exists payment_method text,
  add column if not exists transaction_id text,
  add column if not exists receipt_url text,
  add column if not exists receipt_storage_path text,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.support_contributions
  drop constraint if exists support_contributions_status_check;

alter table if exists public.support_contributions
  drop constraint if exists support_contributions_payment_method_check;

update public.support_contributions
set status = case status
  when 'confirmed' then 'verified'
  when 'cancelled' then 'rejected'
  else 'pending'
end
where status in ('pledged', 'confirmed', 'cancelled');

alter table if exists public.support_contributions
  alter column status set default 'pending';

alter table if exists public.support_contributions
  add constraint support_contributions_status_check
  check (status in ('pending', 'verified', 'rejected', 'refunded'));

alter table if exists public.support_contributions
  add constraint support_contributions_payment_method_check
  check (
    payment_method is null
    or payment_method in ('bankily', 'masrivi', 'sedad', 'card')
  );

create index if not exists idx_support_contributions_status_created
  on public.support_contributions(status, created_at desc);

create index if not exists idx_support_contributions_payment_method
  on public.support_contributions(payment_method);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-receipts',
  'support-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "support_receipts_upload_own" on storage.objects;
create policy "support_receipts_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'support-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "support_receipts_select_own_or_admin" on storage.objects;
create policy "support_receipts_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'support-receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
      )
    )
  );

drop policy if exists "support_receipts_delete_own" on storage.objects;
create policy "support_receipts_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'support-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.admin_set_support_contribution_status(
  p_contribution_id uuid,
  p_admin_id uuid,
  p_status text,
  p_rejected_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contribution public.support_contributions%rowtype;
  v_is_admin boolean;
  v_amount numeric(12,2);
  v_amount_delta numeric(12,2) := 0;
  v_contributor_delta integer := 0;
  v_volunteer_delta integer := 0;
begin
  if p_status not in ('verified', 'rejected', 'refunded') then
    raise exception 'unsupported support contribution status: %', p_status using errcode = '22023';
  end if;

  select exists (
    select 1 from public.profiles p
    where p.id = p_admin_id
      and p.role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;

  select *
  into v_contribution
  from public.support_contributions
  where id = p_contribution_id
  for update;

  if not found then
    return false;
  end if;

  if v_contribution.status = p_status then
    return true;
  end if;

  v_amount := coalesce(v_contribution.amount, 0);

  if v_contribution.status <> 'verified' and p_status = 'verified' then
    if v_contribution.contribution_type = 'money' then
      v_amount_delta := v_amount;
      v_contributor_delta := 1;
    elsif v_contribution.contribution_type = 'volunteer' then
      v_volunteer_delta := 1;
    end if;
  elsif v_contribution.status = 'verified' and p_status in ('rejected', 'refunded') then
    if v_contribution.contribution_type = 'money' then
      v_amount_delta := -v_amount;
      v_contributor_delta := -1;
    elsif v_contribution.contribution_type = 'volunteer' then
      v_volunteer_delta := -1;
    end if;
  end if;

  if v_amount_delta <> 0 or v_contributor_delta <> 0 or v_volunteer_delta <> 0 then
    update public.support_campaigns
    set
      raised_amount = greatest(0, raised_amount + v_amount_delta),
      contributors_count = greatest(0, contributors_count + v_contributor_delta),
      volunteers_count = greatest(0, volunteers_count + v_volunteer_delta),
      last_update_at = now(),
      updated_at = now()
    where id = v_contribution.campaign_id;
  end if;

  update public.support_contributions
  set
    status = p_status,
    verified_by = case when p_status = 'verified' then p_admin_id else verified_by end,
    verified_at = case when p_status = 'verified' then now() else verified_at end,
    rejected_reason = case when p_status in ('rejected', 'refunded') then nullif(trim(p_rejected_reason), '') else null end,
    updated_at = now()
  where id = p_contribution_id;

  return true;
end;
$$;

grant execute on function public.admin_set_support_contribution_status(uuid, uuid, text, text) to authenticated;
