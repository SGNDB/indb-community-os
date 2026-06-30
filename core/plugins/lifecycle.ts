import {registerPlugin, setPluginState, unregisterPlugin} from "@/core/plugins/registry";
import type {PluginManifest} from "@/core/plugins/manifest";

export function installPlugin(manifest: PluginManifest): void {
  registerPlugin(manifest, "enabled");
}

export function uninstallPlugin(id: string): void {
  unregisterPlugin(id as Parameters<typeof unregisterPlugin>[0]);
}

export function enablePlugin(id: string): void {
  setPluginState(id as Parameters<typeof setPluginState>[0], "enabled");
}

export function disablePlugin(id: string): void {
  setPluginState(id as Parameters<typeof setPluginState>[0], "disabled");
}
