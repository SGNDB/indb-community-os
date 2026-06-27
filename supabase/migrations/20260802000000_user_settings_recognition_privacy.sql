-- Recognition privacy defaults
-- Donation recognition stays hidden by default; volunteer recognition can be shown.

alter table public.user_settings
  alter column recognition_visibility
  set default '{"level":true,"badges":true,"summary":true,"donations":false,"volunteer":true}'::jsonb;

update public.user_settings
set recognition_visibility =
  coalesce(recognition_visibility, '{}'::jsonb)
  || jsonb_build_object(
    'donations',
    coalesce((recognition_visibility ->> 'donations')::boolean, false),
    'volunteer',
    coalesce((recognition_visibility ->> 'volunteer')::boolean, true)
  )
where not (recognition_visibility ? 'donations')
   or not (recognition_visibility ? 'volunteer');
