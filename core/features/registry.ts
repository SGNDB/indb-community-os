import {getAllPlugins, findPluginByPath as registryFindByPath} from "@/core/plugins/registry";
import {bootstrapPlugins} from "@/core/plugins/bootstrap";
import {registerEventSubscribers} from "@/core/events/subscribers";
import type {PluginId, Permission, NavSlot} from "@/core/plugins/manifest";

bootstrapPlugins();
registerEventSubscribers();

export type PlatformModuleId = PluginId;

export type PlatformFeatureId = PlatformModuleId | "messages";

export type ModulePermission = Permission;

export type ModuleNavSlot = NavSlot;

export interface PlatformModuleDefinition {
  id: PluginId;
  name: string;
  navKey: string | null;
  navHref: string | null;
  navSlot: NavSlot;
  featureFlag?: string;
  routePrefixes: string[];
  permissions: Permission[];
  translationsNamespace: string;
  events: string[];
}

export interface CoreFeatureDefinition {
  id: "messages";
  name: string;
  navKey: string;
  navHref: string;
  navSlot: "desktop" | "mobile-bottom";
  featureFlag: string;
  routePrefixes: string[];
  permissions: Permission[];
  translationsNamespace: string;
  events: string[];
}

export const CORE_FEATURES: CoreFeatureDefinition[] = [
  {
    id: "messages",
    name: "Messages",
    navKey: "messages",
    navHref: "/messages",
    navSlot: "mobile-bottom",
    featureFlag: "messages",
    routePrefixes: ["/messages"],
    permissions: ["member.read", "member.write"],
    translationsNamespace: "Messages",
    events: ["message.sent"],
  },
];

export const PLATFORM_MODULES: PlatformModuleDefinition[] = getAllPlugins().map((entry) => ({
  id: entry.manifest.id,
  name: entry.manifest.name,
  navKey: entry.manifest.nav?.key ?? null,
  navHref: entry.manifest.nav?.href ?? null,
  navSlot: entry.manifest.nav?.slot ?? "none",
  featureFlag: entry.manifest.featureFlag,
  routePrefixes: entry.manifest.routePrefixes,
  permissions: entry.manifest.permissions,
  translationsNamespace: entry.manifest.translationsNamespace,
  events: entry.manifest.events.map((e) => e.name),
}));

export const PLATFORM_FEATURES = [...CORE_FEATURES, ...PLATFORM_MODULES] as const;

export function findFeatureByPath(pathname: string) {
  const core = CORE_FEATURES.find((f) =>
    f.routePrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );
  if (core) return core;

  const plugin = registryFindByPath(pathname);
  if (!plugin) return null;

  return {
    id: plugin.manifest.id,
    name: plugin.manifest.name,
    navKey: plugin.manifest.nav?.key ?? null,
    navHref: plugin.manifest.nav?.href ?? null,
    navSlot: plugin.manifest.nav?.slot ?? "none",
    featureFlag: plugin.manifest.featureFlag,
    routePrefixes: plugin.manifest.routePrefixes,
    permissions: plugin.manifest.permissions,
    translationsNamespace: plugin.manifest.translationsNamespace,
    events: plugin.manifest.events.map((e) => e.name),
  } as PlatformModuleDefinition;
}
