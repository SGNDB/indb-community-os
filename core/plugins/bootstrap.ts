import {installPlugin} from "@/core/plugins/lifecycle";
import type {PluginManifest} from "@/core/plugins/manifest";
import {ideasManifest} from "@/modules/ideas/manifest";

const manifests: PluginManifest[] = [
  ideasManifest,
  {
    id: "memories",
    name: "Memories",
    version: "1.0.0",
    description: "Community memories and timeline",
    nav: {key: "memory", href: "/memory", slot: "mobile-more"},
    routePrefixes: ["/memory", "/timeline"],
    permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Memory",
    events: [{name: "memory.published"}, {name: "memory.saved"}, {name: "memory.reacted"}],
  },
  {
    id: "graatek",
    name: "Graatek",
    version: "1.0.0",
    description: "Fadla management",
    nav: {key: "fadla", href: "/fadla", slot: "mobile-bottom"},
    routePrefixes: ["/fadla"],
    permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Fadla",
    events: [{name: "graatek.requested"}, {name: "graatek.completed"}],
  },
  {
    id: "campaigns",
    name: "Campaigns",
    version: "1.0.0",
    description: "Donation campaigns and support",
    nav: {key: "campaigns", href: "/campaigns", slot: "mobile-more"},
    routePrefixes: ["/campaigns", "/support"],
    permissions: ["public.read", "member.write", "admin.manage"],
    translationsNamespace: "Support",
    events: [{name: "donation.created"}, {name: "donation.verified"}],
  },
  {
    id: "volunteering",
    name: "Volunteering",
    version: "1.0.0",
    description: "Volunteer opportunities",
    nav: {key: "volunteer", href: "/volunteer", slot: "mobile-more"},
    routePrefixes: ["/volunteer"],
    permissions: ["public.read", "member.write", "admin.manage"],
    translationsNamespace: "Volunteer",
    events: [{name: "volunteer.joined"}, {name: "volunteer.completed"}],
  },
  {
    id: "feed",
    name: "Feed",
    version: "1.0.0",
    description: "Community feed and posts",
    nav: {key: "feed", href: "/feed", slot: "mobile-more"},
    routePrefixes: ["/feed", "/post"],
    permissions: ["member.read", "member.write", "owner.manage", "admin.manage"],
    translationsNamespace: "Feed",
    events: [{name: "feed.posted"}, {name: "feed.commented"}],
  },
  {
    id: "recognition",
    name: "Recognition",
    version: "1.0.0",
    description: "Community recognition and impact",
    nav: null,
    routePrefixes: ["/impact"],
    permissions: ["public.read", "member.read", "admin.manage"],
    translationsNamespace: "CommunityRecognition",
    events: [{name: "recognition.awarded"}],
  },
  {
    id: "settings",
    name: "Settings",
    version: "1.0.0",
    featureFlag: "settings",
    description: "User settings",
    nav: {key: "settings", href: "/settings", slot: "mobile-more"},
    routePrefixes: ["/settings"],
    permissions: ["member.read", "member.write"],
    translationsNamespace: "Settings",
    events: [{name: "settings.updated"}],
  },
];

export function bootstrapPlugins(): void {
  for (const manifest of manifests) {
    installPlugin(manifest);
  }
}

export function getPluginManifests(): PluginManifest[] {
  return manifests;
}
