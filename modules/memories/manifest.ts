import type {PluginManifest} from "@/core/plugins/manifest";

export const memoriesManifest: PluginManifest = {
  id: "memories",
  name: "Memories",
  version: "1.0.0",
  featureFlag: "memories",
  description: "Community memories and timeline",
  nav: {key: "memory", href: "/memory", slot: "mobile-more"},
  routePrefixes: ["/memory", "/memories"],
  permissions: [
    "memories.read",
    "memories.write",
    "memories.comment",
    "memories.react",
    "memories.save",
    "memories.manage",
  ],
  translationsNamespace: "Memory",
  events: [{name: "memory.published"}, {name: "memory.saved"}, {name: "memory.reacted"}],
  emits: ["memory.published", "memory.saved", "memory.reacted"],
  components: ["nav:sidebar", "nav:mobile-more"],
  requires: [],
  capabilities: ["notifications", "media", "storage", "realtime", "search"],
};
