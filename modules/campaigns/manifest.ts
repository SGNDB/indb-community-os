import type {PluginManifest} from "@/core/plugins/manifest";

export const campaignsManifest: PluginManifest = {
  id: "campaigns",
  name: "Campaigns",
  version: "1.0.0",
  featureFlag: "campaigns",
  description: "Donation campaigns and support",
  nav: {key: "campaigns", href: "/campaigns", slot: "mobile-more"},
  routePrefixes: ["/campaigns", "/support"],
  permissions: ["public.read", "member.write", "admin.manage"],
  translationsNamespace: "Support",
  events: [{name: "donation.created"}, {name: "donation.verified"}],
  emits: ["donation.created", "donation.verified"],
  requires: [],
  capabilities: ["notifications", "storage"],
};
