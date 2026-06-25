-- Campaigns redesign: expanded statuses and richer official campaign fields.
-- Safe to run even when the campaigns table has not been installed yet.

do $$
begin
  if to_regclass('public.support_campaigns') is not null then
    alter table public.support_campaigns
      add column if not exists cover_image_url text,
      add column if not exists category text,
      add column if not exists why_this_exists text,
      add column if not exists who_benefits text,
      add column if not exists estimated_beneficiaries integer not null default 0 check (estimated_beneficiaries >= 0),
      add column if not exists timeline jsonb not null default '[]'::jsonb;

    alter table public.support_campaigns
      drop constraint if exists support_campaigns_status_check;

    alter table public.support_campaigns
      add constraint support_campaigns_status_check
      check (status in ('upcoming', 'active', 'paused', 'completed', 'archived'));

    create index if not exists idx_support_campaigns_category_status
      on public.support_campaigns(category, status);
  end if;
end;
$$;
