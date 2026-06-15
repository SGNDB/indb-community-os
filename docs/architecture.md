# INDB Community OS MVP Architecture

## Product scope
- Digital town square for Dakhlet Nouadhibou.
- Civic memory archive with moderation workflow.
- Community ideas workflow with one-vote-per-user.
- Role-aware administration surface.

## App Router structure
- `app/[locale]/(public)`: landing, feed, memory, timeline, ideas.
- `app/[locale]/(auth)`: login, register.
- `app/[locale]/(dashboard)`: profile, memory submit, idea submit.
- `app/[locale]/admin`: basic moderation and stats UI.

## Data and auth
- Supabase SSR clients: browser, server, middleware refresh.
- Auth via Supabase email/password.
- Role labels: `visitor`, `member`, `contributor`, `historian`, `moderator`, `admin`.
- RLS enforces owner/admin write boundaries and public read boundaries.

## Localization
- `next-intl` with locales: Arabic, French (default), English.
- Arabic rendering uses RTL in locale layout.
- Message catalogs: `messages/ar.json`, `messages/fr.json`, `messages/en.json`.

## Storage
- Buckets:
  - `avatars`
  - `post-media`
  - `memory-archive`
- Media path convention for ownership checks: `<auth.uid()>/filename`.

