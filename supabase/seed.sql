insert into public.categories (slug, name, description)
values
  ('history', 'History', 'Stories and archives of Nouadhibou'),
  ('local-news', 'Local News', 'Community updates and local developments'),
  ('education', 'Education', 'Schools, training and knowledge sharing'),
  ('health', 'Health', 'Public health information and initiatives'),
  ('environment', 'Environment', 'Coastal protection and sustainability'),
  ('fishing', 'Fishing', 'Fishing sector and livelihoods'),
  ('port', 'Port', 'Port activities and maritime economy'),
  ('railway', 'Railway', 'Railway history and current relevance'),
  ('sports', 'Sports', 'Community sports activities'),
  ('culture', 'Culture', 'Traditions, arts and cultural life'),
  ('jobs', 'Jobs', 'Employment and opportunities'),
  ('youth', 'Youth', 'Youth initiatives and leadership'),
  ('diaspora', 'Diaspora', 'Connections with Nouadhibou abroad')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.posts (title, content, category_id)
values
  (
    'Beach cleanup campaign',
    'Volunteers organized a cleanup around the public beach this weekend. Let us schedule monthly cleanups and add school participation.',
    (select id from public.categories where slug = 'environment')
  ),
  (
    'Youth AI workshop',
    'A youth coding workshop introduced AI basics and practical tools for students. We need mentors and donated laptops.',
    (select id from public.categories where slug = 'youth')
  ),
  (
    'Fishing port update',
    'Local fishers shared safety and logistics concerns. A community feedback session is proposed to prioritize improvements.',
    (select id from public.categories where slug = 'fishing')
  ),
  (
    'Historical railway photo',
    'Residents shared a restored photo from the railway station era and asked for a public memory exhibit.',
    (select id from public.categories where slug = 'railway')
  ),
  (
    'Community library idea',
    'Families requested a shared reading space near schools. Let us map spaces and partners to launch a pilot library.',
    (select id from public.categories where slug = 'education')
  );

insert into public.memories (title, story, era_label, location, status, category_id)
values
  (
    'Old railway station',
    'Residents remember the station as a key meeting point where many families welcomed relatives and shared news.',
    '1970s-1990s',
    'Railway district',
    'approved',
    (select id from public.categories where slug = 'railway')
  ),
  (
    'Fishing port in the 1980s',
    'Elders recall the rhythm of boats, ice supply, and neighborhood cooperation that sustained port life.',
    '1980s',
    'Fishing port',
    'approved',
    (select id from public.categories where slug = 'fishing')
  ),
  (
    'School memories',
    'Former students shared stories of teachers who inspired civic responsibility and community pride.',
    '1990s',
    'Public schools',
    'approved',
    (select id from public.categories where slug = 'education')
  ),
  (
    'Old market photos',
    'Traders documented old market scenes to preserve local economic memory and family histories.',
    '1980s-2000s',
    'Old market',
    'approved',
    (select id from public.categories where slug = 'culture')
  );

insert into public.ideas (title, description, status, category_id)
values
  (
    'Public library',
    'Create a community-led public library with youth volunteer programs and digital literacy corners.',
    'open',
    (select id from public.categories where slug = 'education')
  ),
  (
    'Beach cleanup',
    'Launch a monthly shoreline cleanup calendar with neighborhood teams and school ambassadors.',
    'open',
    (select id from public.categories where slug = 'environment')
  ),
  (
    'Youth coding club',
    'Host a recurring coding club with local mentors and beginner-friendly workshops for teenagers.',
    'open',
    (select id from public.categories where slug = 'youth')
  ),
  (
    'Historical archive campaign',
    'Collect oral histories, photographs and documents to build a shared city archive for future generations.',
    'open',
    (select id from public.categories where slug = 'history')
  );

