# Graatek Module

User-facing names:

- Arabic: گرعتك
- English/French: Graatek

Internal legacy names remain in place for compatibility: `fadla`, `community_shares`, `community_share_requests`, and `fadla_request_messages`.

## Structure

```text
modules/graatek/
  manifest.ts                    # PluginManifest for Graatek
  actions/
    index.ts                     # Graatek/Fadla server actions guarded by assertFeatureEnabled("graatek")
    admin.ts                     # Reserved for Graatek-only admin mutations
    notifications.ts             # Graatek-specific notification helpers
  types/
    index.ts                     # Graatek/Fadla and legacy community share types
  data/
    index.ts                     # Public Graatek item, request, archive, message, and impact queries
    admin.ts                     # Admin Graatek query helpers
  components/
    fadla-card.tsx
    fadla-client.tsx
    fadla-discussion.tsx
    pages/
      fadla-page.tsx
      fadla-archive-page.tsx
      admin-graatek-page.tsx
      admin-graatek-client.tsx
  permissions/
    README.md
  translations/
    README.md
```

## Manifest

`manifest.ts` registers `graatek` with feature flag `graatek`, route prefixes `/graatek` and `/fadla`, Graatek-specific permissions, sidebar/mobile navigation slots, capabilities, and emitted events.

## Actions

`actions/index.ts` owns item creation, update, delete, request, accept, decline, confirmation, message, and share-count actions. Each exported action calls the Graatek feature guard before doing database work. Compatibility wrappers remain in `app/[locale]/server-actions.ts`.

## Data

`data/index.ts` owns public Graatek item, user, archive, message, and impact queries. `data/admin.ts` owns dedicated admin Graatek query helpers. Legacy `lib/data/fadla.ts` re-exports from the module, and `lib/data/admin.ts` forwards the dedicated admin helpers.

## Components

Graatek UI lives under `modules/graatek/components`. Old paths under `components/fadla/` are re-export stubs. Page-level implementations live under `components/pages`; route files in `app/` stay as thin wrappers.

## Feature Flag

- Flag: `graatek`
- Navigation is hidden when disabled through the feature runtime.
- `/fadla` and `/graatek` are registered route prefixes.
- Public and admin page implementations call `assertFeatureEnabled("graatek")`.
- Graatek actions return `module_disabled` when disabled, except redirect-style delete actions that redirect with the existing error flag.

## Events

| Event | Published At |
| --- | --- |
| `graatek.requested` | After successful request creation and item status update |
| `graatek.completed` | After both receiver and sender confirmations complete |

Events include `actorId`, `entityType`, and `entityId` and do not include private request metadata.

## Capabilities

- `notifications` - Request, acceptance, decline, message, confirmation, and share notifications
- `media` - Graatek item media
- `storage` - Supabase `fadla-media` storage bucket
- `realtime` - Item, request, and message realtime surfaces

## Dependencies

- `@/core/features/server`
- `@/core/events/platform-events`
- `@/lib/supabase/server`
- `@/lib/supabase/admin`
- `@/lib/data/conversations`
- `@/lib/data/notifications`
- `@/lib/validations/community`
- Supabase tables/RPCs: `community_shares`, `community_share_requests`, `fadla_request_messages`, `accept_fadla_request`, `confirm_fadla_action`, `get_fadla_impact`, `ensure_graatek_conversation`

## QA Checklist

- Graatek page loads.
- Create/update/delete item flows respect the feature flag.
- Image upload still uses `fadla-media`.
- Request, accept, decline, message, receive, and handover flows work.
- Conversation creation/sync works for accepted requests.
- Completed exchanges archive the conversation.
- Archive/history loads through `/fadla/archive` redirect.
- `graatek.requested` and `graatek.completed` appear in `/admin/events`.
- Arabic, French, and English translations resolve from the main message files.
- Mobile/desktop and light/dark layouts still render through the moved components.
