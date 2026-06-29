create or replace function public.get_top_10_ideas()
returns table (
  id uuid,
  title text,
  description text,
  status text,
  votes_count int,
  comments_count int,
  participants_count int,
  supporters_count int,
  community_impact_score numeric(6,2),
  rank_90_day int,
  trend text,
  neighborhood text,
  tags text[],
  image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  author_id uuid,
  category_id int,
  author_name text,
  author_username text,
  author_avatar_url text,
  category_name_en text,
  category_name_ar text,
  category_name_fr text,
  category_name_ff text,
  category_name_snk text,
  category_name_wo text
)
language plpgsql
as $$
declare
  v_prev_rankings jsonb;
begin
  select jsonb_object_agg(id::text, rank_90_day) into v_prev_rankings
  from public.ideas
  where rank_90_day is not null;

  update public.ideas
  set community_impact_score = public.calculate_community_impact_score(id),
      impact_score_updated_at = now()
  where created_at >= now() - interval '3 months';

  update public.ideas set rank_90_day = null, trend = null;

  with ranked as (
    select
      id,
      row_number() over (
        order by community_impact_score desc,
                 supporters_count desc,
                 participants_count desc,
                 comments_count desc,
                 votes_count desc,
                 updated_at desc
      ) as new_rank
    from public.ideas
    where created_at >= now() - interval '3 months'
      and (
        community_impact_score > 0
        or votes_count > 0
        or supporters_count > 0
        or participants_count > 0
        or comments_count > 0
      )
    limit 10
  ),
  with_trend as (
    select
      r.id,
      r.new_rank,
      case
        when v_prev_rankings is null or v_prev_rankings->>(r.id::text) is null then 'rising'
        when (v_prev_rankings->>(r.id::text))::int < r.new_rank then 'falling'
        when (v_prev_rankings->>(r.id::text))::int > r.new_rank then 'rising'
        else 'stable'
      end as new_trend
    from ranked r
  )
  update public.ideas i
  set rank_90_day = wt.new_rank,
      trend = wt.new_trend
  from with_trend wt
  where i.id = wt.id;

  return query
  select
    i.id,
    i.title,
    i.description,
    i.status,
    i.votes_count,
    i.comments_count,
    i.participants_count,
    i.supporters_count,
    i.community_impact_score,
    i.rank_90_day,
    i.trend,
    i.neighborhood,
    i.tags,
    i.image_url,
    i.created_at,
    i.updated_at,
    i.author_id,
    i.category_id,
    p.full_name as author_name,
    p.username as author_username,
    p.avatar_url as author_avatar_url,
    c.name_en as category_name_en,
    c.name_ar as category_name_ar,
    c.name_fr as category_name_fr,
    c.name_ff as category_name_ff,
    c.name_snk as category_name_snk,
    c.name_wo as category_name_wo
  from public.ideas i
  left join public.profiles p on p.id = i.author_id
  left join public.categories c on c.id = i.category_id
  where i.rank_90_day is not null
    and i.created_at >= now() - interval '3 months'
  order by i.rank_90_day asc;
end;
$$;
