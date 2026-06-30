import type {NavSlot, PluginEntry, PluginId, PluginManifest, PluginState} from "@/core/plugins/manifest";

const _registry = new Map<PluginId, PluginEntry>();
const _navMap = new Map<string, PluginId>();
const _routeMap = new Map<string, PluginId>();

export function registerPlugin(manifest: PluginManifest, state: PluginState = "enabled"): void {
  const entry: PluginEntry = {manifest, state};
  _registry.set(manifest.id, entry);

  if (manifest.nav) {
    _navMap.set(manifest.nav.key, manifest.id);
  }

  for (const prefix of manifest.routePrefixes) {
    _routeMap.set(prefix, manifest.id);
  }
}

export function unregisterPlugin(id: PluginId): void {
  const entry = _registry.get(id);
  if (!entry) return;

  if (entry.manifest.nav) {
    _navMap.delete(entry.manifest.nav.key);
  }

  for (const prefix of entry.manifest.routePrefixes) {
    _routeMap.delete(prefix);
  }

  _registry.delete(id);
}

export function getPlugin(id: PluginId): PluginEntry | undefined {
  return _registry.get(id);
}

export function getAllPlugins(): PluginEntry[] {
  return Array.from(_registry.values());
}

export function getEnabledPlugins(): PluginEntry[] {
  return getAllPlugins().filter((p) => p.state === "enabled");
}

export function setPluginState(id: PluginId, state: PluginState): void {
  const entry = _registry.get(id);
  if (entry) {
    entry.state = state;
  }
}

export function findPluginByPath(pathname: string): PluginEntry | null {
  const normalized = pathname === "" ? "/" : pathname.replace(/\/+$/, "") || "/";
  for (const [prefix, pluginId] of _routeMap) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return _registry.get(pluginId) ?? null;
    }
  }
  return null;
}

export function findPluginByNavKey(navKey: string): PluginEntry | null {
  const pluginId = _navMap.get(navKey);
  if (!pluginId) return null;
  return _registry.get(pluginId) ?? null;
}

export function getPluginNavItems(): Array<{key: string; href: string; slot: NavSlot}> {
  const items: Array<{key: string; href: string; slot: NavSlot}> = [];
  for (const entry of _registry.values()) {
    if (entry.state === "enabled" && entry.manifest.nav) {
      items.push({
        key: entry.manifest.nav.key,
        href: entry.manifest.nav.href,
        slot: entry.manifest.nav.slot,
      });
    }
  }
  return items;
}

export function getPluginEventNames(): string[] {
  const names: string[] = [];
  for (const entry of _registry.values()) {
    for (const event of entry.manifest.events) {
      names.push(event.name);
    }
  }
  return names;
}

export function getPluginRoutePrefixes(): string[] {
  const prefixes: string[] = [];
  for (const entry of _registry.values()) {
    prefixes.push(...entry.manifest.routePrefixes);
  }
  return prefixes;
}
