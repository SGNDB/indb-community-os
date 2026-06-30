export type PlatformModuleId =
  | "ideas"
  | "memories"
  | "graatek"
  | "campaigns"
  | "volunteering"
  | "feed"
  | "recognition"
  | "settings";

export type PlatformFeatureId = PlatformModuleId | "messages";

export type ModulePermission =
  | "public.read"
  | "member.read"
  | "member.write"
  | "owner.manage"
  | "admin.manage";

export type ModuleNavSlot = "desktop" | "mobile-bottom" | "mobile-more" | "none";

export interface PlatformModuleDefinition {
  id: PlatformModuleId;
  name: string;
  navKey: string | null;
  navHref: string | null;
  navSlot: ModuleNavSlot;
  featureFlag?: string;
  routePrefixes: string[];
  permissions: ModulePermission[];
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
  permissions: ModulePermission[];
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

export const PLATFORM_MODULES: PlatformModuleDefinition[] = [
  {
    id: "ideas",
    name: "Ideas",
    navKey: "ideas",
    navHref: "/ideas",
    navSlot: "mobile-bottom",
    featureFlag: "ideas",
    routePrefixes: ["/ideas"],
    permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Ideas",
    events: ["idea.created", "idea.voted", "idea.completed"],
  },
  {
    id: "memories",
    name: "Memories",
    navKey: "memory",
    navHref: "/memory",
    navSlot: "mobile-more",
    featureFlag: "memories",
    routePrefixes: ["/memory", "/timeline"],
    permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Memory",
    events: ["memory.published", "memory.saved", "memory.reacted"],
  },
  {
    id: "graatek",
    name: "Graatek",
    navKey: "fadla",
    navHref: "/fadla",
    navSlot: "mobile-bottom",
    featureFlag: "graatek",
    routePrefixes: ["/fadla"],
    permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Fadla",
    events: ["graatek.requested", "graatek.completed"],
  },
  {
    id: "campaigns",
    name: "Campaigns",
    navKey: "campaigns",
    navHref: "/campaigns",
    navSlot: "mobile-more",
    featureFlag: "campaigns",
    routePrefixes: ["/campaigns", "/support"],
    permissions: ["public.read", "member.write", "admin.manage"],
    translationsNamespace: "Support",
    events: ["donation.created", "donation.verified"],
  },
  {
    id: "volunteering",
    name: "Volunteering",
    navKey: "volunteer",
    navHref: "/volunteer",
    navSlot: "mobile-more",
    featureFlag: "volunteering",
    routePrefixes: ["/volunteer"],
    permissions: ["public.read", "member.write", "admin.manage"],
    translationsNamespace: "Volunteer",
    events: ["volunteer.joined", "volunteer.completed"],
  },
  {
    id: "feed",
    name: "Feed",
    navKey: "feed",
    navHref: "/feed",
    navSlot: "mobile-more",
    featureFlag: "feed",
    routePrefixes: ["/feed", "/post"],
    permissions: ["member.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Feed",
    events: ["feed.posted", "feed.commented"],
  },
  {
    id: "recognition",
    name: "Recognition",
    navKey: null,
    navHref: null,
    navSlot: "none",
    featureFlag: "recognition",
    routePrefixes: ["/impact"],
    permissions: ["public.read", "member.read", "admin.manage"],
    translationsNamespace: "CommunityRecognition",
    events: ["recognition.awarded"],
  },
  {
    id: "settings",
    name: "Settings",
    navKey: "settings",
    navHref: "/settings",
    navSlot: "mobile-more",
    featureFlag: "settings",
    routePrefixes: ["/settings"],
    permissions: ["member.read", "member.write"],
    translationsNamespace: "Settings",
    events: ["settings.updated"],
  },
];

export const PLATFORM_FEATURES = [...CORE_FEATURES, ...PLATFORM_MODULES] as const;

export function findFeatureByPath(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname.replace(/\/+$/, "") || "/";
  return PLATFORM_FEATURES.find((feature) =>
    feature.routePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)),
  ) ?? null;
}
