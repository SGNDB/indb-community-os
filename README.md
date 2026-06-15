# INDB Community OS

I â¤ NDB - Nouadhibou Community Platform.

Motto: `Ù†ÙˆØ§Ø°ÙŠØ¨Ùˆ Ù„Ù†Ø§ Ø¬Ù…ÙŠØ¹Ù‹Ø§`  
English: `Nouadhibou Belongs to All of Us`

Core philosophy: `Memory â€¢ Participation â€¢ Future`

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Shadcn-style UI primitives
- Supabase (Auth, Postgres, Storage, RLS)
- Zod + React Hook Form
- next-intl (Arabic/French/English with RTL support)
- Framer Motion, Lucide React, Zustand (available for growth)

## Modules in this MVP
- Landing page
- Authentication (`/login`, `/register`)
- User profile (`/profile`)
- Community feed (`/feed`) with posts/comments/likes
- Categories
- Memory archive (`/memory`, `/memory/submit`, `/timeline`)
- Community ideas + one vote per user (`/ideas`, `/ideas/submit`)
- Basic admin dashboard (`/admin`)

## Project structure
- `app/[locale]/(public)` -> public experiences
- `app/[locale]/(auth)` -> login/register
- `app/[locale]/(dashboard)` -> authenticated actions
- `app/[locale]/admin` -> moderation/admin interface
- `components/ui` -> reusable UI primitives
- `components/layout`, `components/feed`, `components/memory`, `components/ideas`, `components/admin`
- `lib/supabase`, `lib/validations`, `lib/constants`, `lib/permissions`
- `messages/ar.json`, `messages/fr.json`, `messages/en.json`
- `supabase/migrations`, `supabase/seed.sql`

## Environment setup
1. Copy `.env.local.example` to `.env.local`.
2. Fill `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` with your real anon key.

`.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://oanwmlouezwtcirrhbyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_ANON_KEY_HERE
```

Important:
- Do not commit real keys.
- Keep `.env.local` local only.

## Local development
1. Install dependencies:
```bash
npm install
```

2. Run the app:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Supabase setup
1. Open Supabase SQL editor.
2. Run migration file:
   - `supabase/migrations/20260601090000_initial_schema.sql`
3. Run seed file:
   - `supabase/seed.sql`

This creates:
- Tables: `profiles`, `categories`, `posts`, `comments`, `post_likes`, `memories`, `memory_media`, `ideas`, `idea_votes`, `reports`, `notifications`
- RLS policies enforcing:
  - public reads for public content
  - self-update profile
  - authenticated create actions
  - owner/admin edit/delete restrictions
  - one like per post per user
  - one vote per idea per user
  - memory visibility by approval status
- Storage buckets:
  - `avatars`
  - `post-media`
  - `memory-archive`

## Notes
- Default locale is French (`/`), with English and Arabic available.
- Arabic view switches to RTL automatically.
- `docs/architecture.md` contains a concise architecture overview.

