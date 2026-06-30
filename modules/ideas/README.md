# Ideas Module

## Structure

```
modules/ideas/
  manifest.ts              # PluginManifest — declares id, routes, permissions, events, capabilities
  actions/
    index.ts               # All server actions (23 exported functions), each guarded by guardFeatureAction('ideas')
  types/
    index.ts               # Idea-specific TypeScript types
  data/
    index.ts               # DB query functions (getIdeaById, getIdeasByAuthor, etc.)
    support.ts             # calculateIdeaSupport helper
  components/
    ideas-toast-handler.tsx # Toast notification component
    idea-submit-form.tsx    # Submit/edit idea form
    idea-card.tsx           # Card display
    idea-list-card.tsx      # Compact list card
    idea-search-bar.tsx     # Filter/search bar
    idea-comments.tsx       # Comment thread
    idea-discussion.tsx     # Realtime discussion (Supabase channels)
    idea-media-gallery.tsx  # Image/media gallery
    idea-vote-button.tsx    # Vote widget
    idea-support-button.tsx # Support widget
    idea-share-button.tsx   # Share widget
    idea-participate.tsx    # Participation request
    idea-participants-list.tsx
    idea-status-badge.tsx   # Status indicator
    idea-progress-bar.tsx   # Progress bar
    idea-timeline.tsx       # Timeline view
    idea-milestone-form.tsx # Milestone management
    participant-join-modal.tsx
    top-idea-row.tsx        # Leaderboard row
    translate-button.tsx    # Translation button
    admin-idea-dropdown.tsx # Admin controls
    idea-project-room.tsx   # Project room widget
    pages/
      ideas-client.tsx            # Ideas list client
      detail-client.tsx           # Detail page client
      admin-ideas-client.tsx      # Admin panel client
      ideas-page.tsx              # Server page (data fetch + render)
      idea-detail-page.tsx        # Server page (data fetch + render)
      idea-submit-page.tsx        # Server page (data fetch + render)
      admin-ideas-page.tsx        # Server page (data fetch + render)
```

## Module Pattern

Each module follows these conventions:

1. **manifest.ts** — Exports a `PluginManifest` object registered in `core/plugins/bootstrap.ts`
2. **actions/index.ts** — `'use server'` file with all server actions, each guarded by `guardFeatureAction('ideas')`
3. **types/index.ts** — Exported types, re-exported from `types/database.ts` for backward compat
4. **data/** — DB query functions, re-exported from `lib/data/ideas.ts` for backward compat
5. **components/** — UI components, re-exported from `components/ideas/` for backward compat
6. **components/pages/** — Thin server pages (data fetch) + client pages (interactivity)

## Route Files (thin wrappers)

Route files in `app/` are 1-line re-exports:

```ts
export { default, generateMetadata } from "@/modules/ideas/components/pages/ideas-page";
```

## Feature Flag

- Flag: `ideas` (defined in `DEFAULT_FEATURE_FLAGS` at `lib/data/admin.ts`)
- Toggle: Admin UI at `/admin/plugins`
- When disabled: nav hidden, routes 404, all server actions return `module_disabled`

## Events

| Event | Published At |
|-------|-------------|
| `idea.created` | `submitIdeaAction` after DB insert |
| `idea.voted` | `voteIdeaAction` after vote insert |
| `idea.completed` | `updateIdeaStatusAction` / `updateIdeaOwnerProgressAction` when status = completed |

Events are persisted to `event_logs` table and viewable at `/admin/events`.

## Capabilities

- `notifications` — Sends in-app notifications for comments, support, participation, messages, status changes
- `media` — Uploads/manages images and files via `idea_media` table
- `realtime` — `idea-discussion.tsx` uses Supabase channels (broadcast + postgres_changes) for live messaging

## Key Dependencies

- `@/lib/supabase/server` / `admin` — DB access
- `@/core/features/server` — `assertFeatureEnabled` for feature flag gating
- `@/core/events/platform-events` — `publishPlatformEvent`
- `@/lib/data/notifications` — Notification creation helpers
- `@/lib/data/media` — Media upload/delete
- `@/lib/i18n/routing` — Locale-aware routing
