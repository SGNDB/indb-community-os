export type PluginId =
  | "ideas"
  | "memories"
  | "graatek"
  | "campaigns"
  | "volunteering"
  | "feed"
  | "recognition"
  | "settings";

export type Permission =
  | "public.read"
  | "member.read"
  | "member.write"
  | "owner.manage"
  | "admin.manage";

export type NavSlot = "desktop" | "mobile-bottom" | "mobile-more" | "none";

export interface PluginNavItem {
  key: string;
  href: string;
  slot: NavSlot;
  labelKey?: string;
}

export interface PluginEvent {
  name: string;
  description?: string;
}

export interface PluginManifest {
  id: PluginId;
  name: string;
  version: string;
  description: string;
  author?: string;
  nav: PluginNavItem | null;
  routePrefixes: string[];
  permissions: Permission[];
  translationsNamespace: string;
  events: PluginEvent[];
  featureFlag?: string;
  requires?: string[];
  capabilities?: string[];
}

export type PluginState = "enabled" | "disabled" | "error";

export interface PluginEntry {
  manifest: PluginManifest;
  state: PluginState;
  error?: string;
}
