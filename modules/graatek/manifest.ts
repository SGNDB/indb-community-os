import type {PluginManifest} from "@/core/plugins/manifest";

export const graatekManifest: PluginManifest = {
  id: "graatek",
  name: "Graatek",
  version: "1.0.0",
  featureFlag: "graatek",
  description: "Community sharing, requests, messaging, and completion",
  nav: {key: "fadla", href: "/fadla", slot: "mobile-bottom"},
  routePrefixes: ["/graatek", "/fadla"],
  permissions: [
    "graatek.read",
    "graatek.write",
    "graatek.request",
    "graatek.message",
    "graatek.complete",
    "graatek.manage",
  ],
  translationsNamespace: "Graatek",
  events: [{name: "graatek.requested"}, {name: "graatek.completed"}],
  emits: ["graatek.requested", "graatek.completed"],
  components: ["nav:sidebar", "nav:mobile-bottom"],
  requires: [],
  capabilities: ["notifications", "media", "storage", "realtime"],
};
