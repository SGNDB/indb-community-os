# I ❤️ NDB — Plugin Platform Evolution Roadmap
## From Modular App to True Plugin Platform

## Mission
Transform I ❤️ NDB from a modular application into a true plugin platform — where every feature is a self-contained plugin with a formal contract, the core is stable enough that plugins can be built without modifying core files, and the architecture is reusable across different communities.

Do NOT rewrite the application. Evolve it incrementally. Every phase ends with a production build. Never break existing functionality.

---

## Terminology (Internal Architecture Language)

| Term | Meaning | Code Location | Example |
|---|---|---|---|
| Core | The app shell — layout, auth, middleware, routing, i18n | `app/`, `core/`, `lib/` | Layout, middleware, Supabase clients |
| Platform Services | The SDK, event bus, plugin registry, feature flags | `core/` | PluginRegistry, SDK, EventBus |
| Plugin | A full feature with routes, components, data, actions | `modules/` (later `plugins/`) | Ideas, Feed, Memories |
| Extension | A lightweight integration — search provider, notification handler | Via plugin manifest slot | IdeasSearchProvider |
| Widget | A dashboard-only UI component registered by a plugin | Via plugin manifest slot | IdeasDashboardWidget |

These terms guide architecture docs, not directory structure. A plugin IS also an extension and widget provider — it registers components to multiple slot points via its manifest.

---

## Current State (Already Completed)

| Area | What exists | Status |
|---|---|---|
| `core/features/registry.ts` | Platform module definitions (id, name, routes, nav slot, events, feature flag) | Done |
| `core/features/server.ts` | `getFeatureRuntime()`, `isFeatureEnabled()`, `assertFeatureEnabled()`, `findFeatureByPath()` | Done |
| `core/events/platform-events.ts` | Typed event names + `publishPlatformEvent()` (no-op return) | Done |
| `modules/` skeleton | 8 directories with `.gitkeep` subdirs (actions/, components/, data/, permissions/, translations/, types/) | Done |
| `lib/data/admin.ts` | `AdminFeatureFlags` updated with campaigns, feed, recognition, settings | Done |
| `app/[locale]/layout.tsx` | Calls `getFeatureRuntime()`, gates routes by `findFeatureByPath`, passes nav keys to Sidebar + MobileNav | Done |
| Sidebar + MobileNav | Filter nav items by `enabledNavigationKeys` | Done |
| Admin settings page | Renders toggles for all feature flags | Done |
| `guardFeatureAction` | 13 Ideas server actions protected at action level | Done |

---

## Phase 1 — The Plugin Contract

### 1.1 Create `core/plugins/manifest.ts`

The `PluginManifest` type — the formal contract every module must implement.

```typescript
export interface PluginManifest {
  /** Unique id (e.g. "ideas") */
  id: string;
  /** Human-readable name */
  name: string;
  /** semver */
  version: string;
  /** Other plugin IDs this depends on */
  dependencies?: string[];
  /** Route prefixes this plugin owns (e.g. ["/ideas"]) */
  routePrefixes: string[];
  /** React components registered to slot points */
  components?: {
    "nav:sidebar"?: () => NavItem;
    "nav:mobile-bottom"?: () => NavItem;
    "nav:mobile-more"?: () => NavItem;
    "dashboard:widget"?: React.ComponentType<{}>;
    "search:providers"?: SearchProvider;
    "settings:panel"?: React.ComponentType<{}>;
    "profile:tab"?: ProfileTab;
  };
  /** Permissions this plugin registers — who can do what */
  permissions?: string[];
  /** Capabilities this plugin requires from the platform — what services it needs */
  capabilities?: Array<"realtime" | "storage" | "search" | "notifications" | "media" | "cache" | "analytics">;
  /** Events this plugin emits */
  emits?: string[];
  /** Events this plugin consumes — maps event name to handler */
  listens?: Record<string, (payload: any) => Promise<void>>;
  /** Namespace in translation files */
  translationsNamespace: string;
  /** Feature flag key in AdminFeatureFlags */
  featureFlag: string;
}
```

### 1.2 Create `core/plugins/registry.ts`

The `PluginRegistry` class — build-time registration, runtime toggle via feature flags.

```typescript
class PluginRegistry {
  private manifests = new Map<string, PluginManifest>();
  private eventHandlers = new Map<string, Set<(payload: any) => Promise<void>>>();

  register(manifest: PluginManifest): void;
  getEnabled(featureIds: string[]): PluginManifest[];
  getById(id: string): PluginManifest | undefined;
  getComponents(slot: string, enabledIds: string[]): React.ComponentType[];
  on(event: string, handler: (payload: any) => Promise<void>): void;
  emit(event: string, payload: any): Promise<void>;
  validate(manifest: PluginManifest, enabledIds: string[], platformCapabilities: string[]): {
    valid: boolean;
    missingCapabilities: string[];
    missingDependencies: string[];
  };
  getDependents(capability: string): PluginManifest[];
}
```

`register()` is called at import time (static import). `getEnabled()` receives the current feature flags at runtime. `validate()` checks dependencies + capabilities before a plugin activates. `getDependents()` finds all plugins that would break if a capability is disabled.

### 1.3 Create `core/plugins/context.tsx`

React context so any component can check plugin state without prop drilling.

```tsx
const PluginContext = createContext<{
  isEnabled: (id: string) => boolean;
  getComponent: (slot: string) => React.ComponentType | null;
  getNavItems: (slot: string) => NavItem[];
} | null>(null);

export function PluginProvider({ children, enabledFeatureIds }) { ... }
export function usePlugin(id: string): boolean;
export function usePluginSlot(slot: string): React.ComponentType | null;
export function usePluginNavItems(slot: string): NavItem[];
```

### 1.4 Create `core/plugins/lifecycle.ts`

Concrete database-backed lifecycle operations.

```typescript
export async function installPlugin(manifest: PluginManifest): Promise<void>;
  // 1. Run plugin's SQL migrations from modules/<id>/migrations/
  // 2. Insert row into plugin_versions (id, version, installed_at)
  // 3. Set feature flag to true
  // 4. Log to plugin_logs

export async function uninstallPlugin(id: string): Promise<void>;
  // 1. Disable feature flag
  // 2. Optionally run rollback migrations
  // 3. Delete from plugin_versions
  // 4. Log
```

### 1.5 Create `core/plugins/permissions.ts`

```typescript
export function assertPluginPermission(permission: string): void;
export function usePluginPermission(permission: string): boolean;
// Uses existing lib/permissions/roles.ts for role hierarchy
// Maps "ideas.vote" → user must have role >= "member"
```

### 1.6 Migrate `core/features/registry.ts`

Replace the hardcoded `PLATFORM_MODULES` array. Each module now exports its manifest. The registry derives everything from manifests.

Before:
```typescript
export const PLATFORM_MODULES: PlatformModuleDefinition[] = [
  { id: "ideas", name: "Ideas", navKey: "ideas", ... },
  ...
];
```

After:
```typescript
import ideasManifest from "@/modules/ideas/manifest";
import feedManifest from "@/modules/feed/manifest";
// ...
export const PLUGIN_MANIFESTS = [ideasManifest, feedManifest, ...];
export const PLATFORM_MODULES = PLUGIN_MANIFESTS.map(m => ({
  id: m.id, name: m.name, navKey: m.id,
  routePrefixes: m.routePrefixes,
  featureFlag: m.featureFlag,
  permissions: m.permissions,
  events: [...(m.emits ?? []), ...Object.keys(m.listens ?? {})],
  translationsNamespace: m.translationsNamespace,
}));
```

### 1.7 Keep directory name `modules/` — do NOT rename to `plugins/` yet

The rename happens in Phase 8, when every module actually implements the full contract.

---

## Phase 2 — Platform SDK

### 2.1 Create `core/sdk/`

The SDK is the recommended public API for plugins. It is a convenience and stability layer — plugins CAN still import Supabase directly when needed, but the SDK provides the stable, versioned, documented path.

```
core/sdk/
├── index.ts              # Re-exports everything
├── auth.ts               # getCurrentUser(), requireAuth(), hasRole()
├── events.ts             # emit(event, payload), on(event, handler) — typed
├── notifications.ts      # send(userId, type, data) — creates notification records
├── search.ts             # index(entityType, entityId, content), search(query, filters)
├── storage.ts            # upload(bucket, path, file), getUrl(bucket, path), delete(bucket, path)
├── media.ts              # uploadImage(file, options), getOptimizedUrl(url, width)
├── permissions.ts        # assertPermission(permission), hasPermission(permission), getUserRole()
├── analytics.ts          # track(event, properties) — increments counters, stores events
├── settings.ts           # get(key), set(key, value) — plugin-scoped key-value store
├── cache.ts              # get(key), set(key, value, ttl), invalidate(pattern) — in-memory or KV
├── realtime.ts           # subscribe(channel, event, callback), unsubscribe(channel)
└── logger.ts             # info(pluginId, message), warn(pluginId, message), error(pluginId, message, error?)
```

**Design principles:**
- Each SDK module is a thin wrapper — typically 30-80 lines
- All functions are async
- Plugins import from `@/core/sdk`, never from another plugin directly
- SDK functions log calls to `plugin_logs` table for debugging
- SDK is extensible — new methods added without breaking existing plugins

---

## Phase 3 — Shared UI (`core/ui/`)

### 3.1 Why

Without shared UI, every plugin reinvents buttons, cards, modals, badges. The platform becomes visually inconsistent. `core/ui` is the authorized component palette — the ONLY source of UI primitives for plugins.

### 3.2 Structure

```
core/ui/
├── index.ts              # Re-exports everything
├── button.tsx            # Re-export of shadcn Button + platform variants
├── card.tsx              # Re-export of shadcn Card + IdeaCard, MemoryCard presets
├── badge.tsx             # Re-export of shadcn Badge + status badge helper
├── avatar.tsx            # OnlineAvatar — presence-aware avatar
├── dialog.tsx            # Re-export of shadcn Dialog + Sheet
├── toast.tsx             # Wrapper around sonner toast with platform defaults
├── skeleton.tsx          # Re-export of shadcn Skeleton
├── progress-bar.tsx      # Re-export of shadcn Progress
├── page-header.tsx       # PageHeader(title, subtitle, action) — consistent page tops
├── empty-state.tsx       # EmptyState(icon, title, description, action)
├── stat-card.tsx         # StatCard(icon, label, value, trend)
├── confirm-dialog.tsx    # ConfirmDialog — reusable delete confirmation
├── data-list.tsx         # DataList — loading/skeleton/empty/error states wrapper
└── plugin-slot.tsx       # PluginSlot(name, fallback) — renders registered slot components
```

### 3.3 Rules

- Plugins import UI from `@/core/ui`, never from `@/components/ui/` or `@/components/shared/` directly
- `core/ui` re-exports shadcn primitives AND platform-specific components with consistent styling
- This gives the platform team control over the visual system — update one file, every plugin updates
- New shared components are added to `core/ui`, not scattered across `components/`

---

## Phase 4 — Plugin Capabilities

### 4.1 What capabilities are

Capabilities declare what platform services a plugin requires. They are NOT permissions (which control user access). Capabilities ensure the platform has the necessary infrastructure enabled before a plugin activates.

### 4.2 How they work

```typescript
// modules/ideas/manifest.ts
capabilities: ["realtime", "search", "notifications"]

// modules/campaigns/manifest.ts
capabilities: ["storage", "notifications", "media"]
```

### 4.3 Registry validation

```typescript
// core/plugins/registry.ts
const platformCapabilities = {
  realtime: featureFlags.realtime,
  storage: true,
  search: true,
  notifications: true,
  media: true,
  cache: featureFlags.realtime,
  analytics: true,
};

function validate(manifest: PluginManifest): ValidationResult {
  const missing = manifest.capabilities?.filter(c => !platformCapabilities[c]) ?? [];
  const missingDeps = manifest.dependencies?.filter(dep => !registry.isEnabled(dep)) ?? [];
  return {
    valid: missing.length === 0 && missingDeps.length === 0,
    missingCapabilities: missing,
    missingDependencies: missingDeps,
  };
}
```

### 4.4 Admin UI feedback

In the Plugin Manager page:
- If a capability is disabled: *"Ideas requires Realtime — enable it in Settings → Features"*
- If a dependency is disabled: *"Ideas depends on Messages — enable Messages first"*
- Admin cannot enable a plugin until its requirements are met

---

## Phase 5 — Plugin Event Bus

### 5.1 Wire `publishPlatformEvent()` to the registry

```typescript
// core/events/platform-events.ts
export async function publishPlatformEvent(event: PlatformEventPayload) {
  const registry = getRegistry();
  await registry.emit(event.name, event);
  return { ...event, occurredAt: event.occurredAt ?? new Date().toISOString() };
}
```

### 5.2 Add event calls to existing server actions

```typescript
// After successful idea creation:
await publishPlatformEvent({
  name: "idea.created",
  actorId: user.id,
  entityType: "idea",
  entityId: idea.id,
  metadata: { title: idea.title },
});
```

### 5.3 Add cross-plugin event handlers

```typescript
// modules/recognition/manifest.ts
listens: {
  "idea.completed": async (payload) => {
    await awardBadge(payload.actorId, "idea-champion");
  },
  "volunteer.completed": async (payload) => {
    await awardBadge(payload.actorId, "volunteer-star");
  },
}
```

---

## Phase 6 — Plugin Slot System

### 6.1 Defined slot points

| Slot | Renders in | What plugins provide |
|---|---|---|
| `nav:sidebar` | Desktop sidebar | Nav items |
| `nav:mobile-bottom` | Mobile bottom nav | Nav items |
| `nav:mobile-more` | Mobile "More" menu | Nav items |
| `dashboard:widget` | Dashboard page | Summary widgets |
| `search:providers` | Global search | Searchable entity types |
| `settings:panel` | Settings page | Plugin-specific settings panels |
| `profile:tab` | User profile | Additional profile tabs |

### 6.2 `PluginSlot` component (in `core/ui/plugin-slot.tsx`)

```tsx
export function PluginSlot({ name, fallback }: { name: string; fallback?: React.ReactNode }) {
  const Component = usePluginSlot(name);
  if (!Component) return fallback ?? null;
  return <Component />;
}
```

If no plugin registers a component for that slot, the fallback renders (or nothing).

### 6.3 Usage

```tsx
// In the dashboard page:
<PluginSlot name="dashboard:widget" fallback={<DefaultWidget />} />

// In the sidebar:
const navItems = usePluginNavItems("nav:sidebar");
```

---

## Phase 7 — Plugin Manager Admin UI

### 7.1 New admin page: `/admin/plugins`

| Column | Source |
|---|---|
| Plugin | name + icon from manifest |
| Version | manifest.version |
| Status | enabled/disabled from feature flags |
| Capabilities | manifest.capabilities (unmet in red) |
| Dependencies | manifest.dependencies (unmet in red) |
| Health | `healthCheck()` result |
| Actions | Enable, Disable, Configure, View Logs, Uninstall |

### 7.2 Health check (optional per plugin)

```typescript
// modules/ideas/manifest.ts
healthCheck: async (sdk) => {
  const count = await sdk.cache.get("ideas:count");
  return { status: "healthy", message: `${count ?? 0} ideas active` };
};
```

### 7.3 Plugin configuration UI

```typescript
// modules/ideas/manifest.ts
settings: {
  fields: [
    { key: "maxDescriptionLength", type: "number", default: 500 },
    { key: "enableVoting", type: "boolean", default: true },
    { key: "topIdeasPeriod", type: "select", options: ["7d", "30d", "90d"], default: "90d" },
  ],
}
```

Plugin Manager auto-renders a form from these fields. Values persist in `plugin_settings` table.

---

## Phase 8 — Full Plugin Migration

### 8.1 Move each plugin completely (one at a time)

For each module, in order:

1. Move `lib/data/<module>.ts` → `modules/<id>/data/index.ts`
2. Move server actions from `server-actions.ts` → `modules/<id>/actions/index.ts`
3. Move types from `types/database.ts` → `modules/<id>/types/index.ts`
4. Create `modules/<id>/manifest.ts` implementing PluginManifest
5. Add re-exports in original locations for backward compatibility
6. Register manifest in `core/plugins/registry.ts`
7. Wire events into actions
8. Delete original files after all imports are updated

Migration order: **Ideas → Feed → Memories → Graatek → Campaigns → Volunteering → Settings → Recognition**

After EACH module: run `npm run build`. Never break the build.

### 8.2 Rename `modules/` → `plugins/`

Only after EVERY module has:
- A `manifest.ts` implementing `PluginManifest`
- Its actions extracted from the monolith
- Its data layer extracted from `lib/data/`
- Its types extracted from `types/database.ts`
- Events wired into its server actions
- SDK integration

Then rename the directory. The name matches reality.

### 8.3 Shrink the monolith

After all 8 plugins are migrated:
- `server-actions.ts` goes from 4591 lines → core/shared actions only (auth, profile, upload, admin)
- `lib/data/` shrinks similarly
- `types/database.ts` becomes re-exports from plugins

---

## Database Tables

```sql
-- Tracks installed plugin version for upgrade/rollback
create table plugin_versions (
  id text primary key,
  version text not null,
  installed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Plugin-scoped key-value settings (rendered by Plugin Manager UI)
create table plugin_settings (
  plugin_id text not null,
  key text not null,
  value jsonb not null,
  primary key (plugin_id, key)
);

-- Structured plugin logs (errors, warnings, lifecycle events)
create table plugin_logs (
  id uuid default gen_random_uuid() primary key,
  plugin_id text not null,
  level text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

---

## What We Do NOT Build

| Feature | Why not |
|---|---|
| `.ndb-plugin` package format | Premature — same app, same build. Revisit when third parties exist |
| Plugin marketplace | Premature — no third-party plugins yet |
| Runtime plugin upload via admin | Next.js cannot dynamically import code in production. Plugins are build-time |
| Plugin signature validation | No package distribution yet |
| Remote plugin loading from URLs | Security risk, SSR-incompatible |
| Plugin sandboxing (iframes/VM) | Complexity exceeds the need. Single trust domain |
| `sdk.database` abstraction | Supabase RLS is the security layer. Plugins import Supabase directly |

---

## Complete File Manifest

### Files to Create

```
core/plugins/manifest.ts            # PluginManifest type
core/plugins/registry.ts            # PluginRegistry class
core/plugins/context.tsx            # PluginProvider + usePlugin() + usePluginSlot() + usePluginNavItems()
core/plugins/lifecycle.ts           # installPlugin(), uninstallPlugin()
core/plugins/permissions.ts         # assertPluginPermission(), usePluginPermission()
core/sdk/index.ts                   # Re-exports
core/sdk/auth.ts                    # getCurrentUser(), requireAuth(), hasRole()
core/sdk/events.ts                  # emit(), on() — typed
core/sdk/notifications.ts           # send()
core/sdk/search.ts                  # index(), search()
core/sdk/storage.ts                 # upload(), getUrl(), delete()
core/sdk/media.ts                   # uploadImage(), getOptimizedUrl()
core/sdk/permissions.ts             # assertPermission(), hasPermission(), getUserRole()
core/sdk/analytics.ts               # track()
core/sdk/settings.ts                # get(), set()
core/sdk/cache.ts                   # get(), set(), invalidate()
core/sdk/realtime.ts                # subscribe(), unsubscribe()
core/sdk/logger.ts                  # info(), warn(), error()
core/ui/index.ts                    # Re-exports
core/ui/button.tsx                  # Shared button
core/ui/card.tsx                    # Shared card + presets
core/ui/badge.tsx                   # Shared badge + status helpers
core/ui/avatar.tsx                  # OnlineAvatar
core/ui/dialog.tsx                  # Dialog + Sheet
core/ui/toast.tsx                   # Sonner wrapper
core/ui/skeleton.tsx                # Skeleton
core/ui/progress-bar.tsx            # Progress
core/ui/page-header.tsx             # PageHeader
core/ui/empty-state.tsx             # EmptyState
core/ui/stat-card.tsx               # StatCard
core/ui/confirm-dialog.tsx          # ConfirmDialog
core/ui/data-list.tsx               # DataList (loading/empty/error states)
core/ui/plugin-slot.tsx             # PluginSlot component
app/[locale]/admin/plugins/page.tsx # Plugin Manager admin page
modules/*/manifest.ts               # One per module (8 files)
```

### Files to Modify

```
core/features/registry.ts       # Derive from manifests instead of hardcoded arrays
core/features/server.ts         # Update to use registry
core/events/platform-events.ts  # Wire into registry.emit()
app/[locale]/layout.tsx         # Add PluginProvider
components/layout/sidebar.tsx   # Use usePluginNavItems()
components/layout/mobile-nav.tsx# Use usePluginNavItems()
app/[locale]/server-actions.ts  # Add guardFeatureAction + event calls; shrink as modules extract
lib/data/*                      # Shrink as modules extract
types/database.ts               # Shrink as modules extract
messages/*.json                 # Progressively shrink as modules extract
```

### Files to Delete (end state)

```
modules/                        # Renamed to plugins/
app/[locale]/server-actions.ts  # Only if fully emptied — else keep shared actions
lib/data/ideas.ts               # Moved to modules/ideas/data/
lib/data/feed.ts                # Moved to modules/feed/data/
... (one per migrated module)
```

---

## Migration Order

| Step | Action | Buildable | Depends On |
|---|---|---|---|
| 1 | Create `core/plugins/manifest.ts` | ✅ | — |
| 2 | Create `core/plugins/registry.ts` | ✅ | Step 1 |
| 3 | Create `core/plugins/context.tsx` | ✅ | Step 2 |
| 4 | Create `core/plugins/lifecycle.ts` | ✅ | Step 1 |
| 5 | Create `core/plugins/permissions.ts` | ✅ | Step 1 |
| 6 | Create `core/sdk/` (12 files) | ✅ | — |
| 7 | Create `core/ui/` (15 files) | ✅ | — |
| 8 | Migrate `core/features/registry.ts` to derive from manifests | ✅ | Step 2 |
| 9 | Wire PluginProvider into layout, update Sidebar + MobileNav | ✅ | Step 3 |
| 10 | Upgrade event bus to use registry.emit() | ✅ | Step 2 |
| 11 | Wire events into existing server actions | ✅ | Step 10 |
| 12 | Create plugin_versions, plugin_settings, plugin_logs tables | ✅ | — |
| 13 | Build admin Plugin Manager page | ✅ | Steps 2, 4, 5 |
| 14 | Move Ideas plugin fully | ✅ | Steps 1-13 |
| 15 | Move Feed plugin | ✅ | Step 14 |
| 16 | Move Memories plugin | ✅ | Step 15 |
| 17 | Move Graatek plugin | ✅ | Step 16 |
| 18 | Move Campaigns plugin | ✅ | Step 17 |
| 19 | Move Volunteering plugin | ✅ | Step 18 |
| 20 | Move Settings plugin | ✅ | Step 19 |
| 21 | Move Recognition plugin | ✅ | Step 20 |
| 22 | Delete deprecated files | ✅ | Step 21 |
| 23 | Rename `modules/` → `plugins/` | ✅ | Step 22 |
| 24 | Write `docs/plugin-development.md` | ✅ | Step 23 |

---

## Quality Gates

- After EVERY step: `npm run build` must pass
- Admin feature flags must enable/disable plugins with full effect (nav, routes, actions, widgets)
- Disabling a plugin must not break any other plugin
- Enabling a plugin with unmet dependencies/capabilities shows a clear error message
- All 6 locales must still work
- Plugin settings must persist across page reloads
- SDK functions must log to `plugin_logs` table
- `core/ui` components must be used consistently across all modules

---

## Final Architecture

```
app/                          # Core app shell only
core/
├── plugins/                  # Plugin system (manifest, registry, lifecycle, context, permissions)
├── features/                 # Feature flag runtime (derived from manifests)
├── events/                   # Event bus
├── sdk/                      # Public API for plugins (auth, events, notifications, search, storage, media, permissions, analytics, settings, cache, realtime, logger)
└── ui/                       # Shared component palette (button, card, badge, avatar, dialog, toast, skeleton, progress-bar, page-header, empty-state, stat-card, confirm-dialog, data-list, plugin-slot)
plugins/                      # Renamed from modules/ after migration
├── ideas/
│   ├── manifest.ts
│   ├── actions/
│   ├── data/
│   ├── components/
│   └── types/
├── feed/
├── memories/
├── graatek/
├── campaigns/
├── volunteering/
├── recognition/
└── settings/
lib/                          # Shared utilities only (supabase clients, i18n, cn, etc.)
types/                        # Shared types only + re-exports from plugins
```

A developer adds a new feature by:
1. Creating `plugins/my-feature/manifest.ts` implementing `PluginManifest`
2. Importing and registering it in `core/plugins/registry.ts`
3. Adding `myFeature: boolean` to `AdminFeatureFlags`
4. Writing feature code that imports from `@/core/sdk` and `@/core/ui`
5. Zero changes to `app/`, `components/layout/`, `core/features/`, or `lib/data/`

The plugin platform is real.
