# Memories Module

## Structure

```text
modules/memories/
  manifest.ts                    # PluginManifest for Memories
  actions/
    index.ts                     # Memory server actions guarded by assertFeatureEnabled("memories")
    notifications.ts             # Memory-specific notification helpers
  types/
    index.ts                     # Memory-specific TypeScript types
  data/
    index.ts                     # Memory queries and interaction helpers
    admin.ts                     # Admin memory query helpers
    timeline.ts                  # Timeline query functions
    timeline-constants.ts        # Timeline constants safe for client imports
  components/
    memory-card.tsx
    memory-actions.tsx
    memory-comments.tsx
    memory-details-client.tsx
    memory-grid.tsx
    memory-reactions.tsx
    memory-reaction-modal.tsx
    memory-save-button.tsx
    memory-upload-form.tsx
    memory-submitted-toast.tsx
    memory-error-toast.tsx
    memory-verification-badge.tsx
    pages/
      memory-page.tsx
      memory-detail-page.tsx
      memory-submit-page.tsx
      memory-timeline-page.tsx
      admin-memories-page.tsx
      admin-memories-client.tsx
  permissions/
  translations/
    README.md
```

## Manifest

`manifest.ts` registers the module as `memories` with feature flag `memories`, route prefixes `/memory` and `/memories`, memory-specific permissions, navigation slots, capabilities, and emitted events.

## Actions

`actions/index.ts` owns all Memories server actions:

- Submit, update, delete, share memories
- React, save, unsave memories
- Add, update, delete comments
- Load timeline memories
- Fetch memory reaction details

Each action calls the Memories feature guard before performing work. Compatibility wrappers remain in `app/[locale]/server-actions.ts`.

## Data

`data/index.ts` contains public memory queries and interaction helpers. `data/timeline.ts` owns timeline queries. `data/admin.ts` owns admin memory query helpers. Old paths under `lib/data/` re-export from the module.

## Components

Memory UI lives under `modules/memories/components`. Old paths under `components/memory/` are re-export stubs for backward compatibility. Page-level components live under `components/pages`.

## Route Wrappers

Next.js route files stay in `app/` and re-export module page components, for example:

```ts
export {default, generateMetadata} from "@/modules/memories/components/pages/memory-page";
```

## Feature Flag

- Flag: `memories`
- Navigation is hidden when disabled through the feature runtime.
- `/memory` routes are blocked by route-prefix gating.
- `/timeline` is legacy memory-powered UI and is guarded directly in the module page.
- Memory actions return `module_disabled` when disabled.

## Events

| Event | Published At |
| --- | --- |
| `memory.published` | After successful memory insert |
| `memory.saved` | After successful save upsert |
| `memory.reacted` | After successful reaction insert/update |

Events include `actorId`, `entityType`, and `entityId`; reaction metadata is limited to the public reaction type.

## Capabilities

- `notifications` - Memory comment and reaction notifications
- `media` - Memory media upload/delete helpers
- `storage` - Supabase storage-backed media
- `realtime` - Manifest capability for interactive memory surfaces
- `search` - Manifest capability for memory discoverability

## Dependencies

- `@/core/features/server`
- `@/core/events/platform-events`
- `@/lib/supabase/server`
- `@/lib/data/media`
- `@/lib/data/notifications`
- `@/lib/i18n/routing`

## QA Checklist

- Memory list route loads.
- Memory detail route loads.
- Memory submit/edit route loads.
- Admin memories route loads.
- Timeline route loads.
- Submit, save, react, comment, share, update, and delete actions respect the `memories` feature flag.
- `memory.published`, `memory.saved`, and `memory.reacted` appear in `/admin/events` after successful operations.
- Arabic, French, and English translations resolve from the main message files.
- Mobile/desktop and light/dark layouts still render through the moved components.
