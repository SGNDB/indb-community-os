import type {PluginManifest} from "@/core/plugins/manifest";

export const ideasManifest: PluginManifest = {
  id: "ideas",
  name: "Ideas",
  version: "1.0.0",
  featureFlag: "ideas",
  description: "Community ideas and voting",
  nav: {key: "ideas", href: "/ideas", slot: "mobile-bottom"},
  routePrefixes: ["/ideas"],
  permissions: ["public.read", "member.write", "owner.manage", "admin.manage"],
  translationsNamespace: "Ideas",
  events: [{name: "idea.created"}, {name: "idea.voted"}, {name: "idea.completed"}],
  requires: [],
  capabilities: ["notifications", "media", "realtime"],
};
