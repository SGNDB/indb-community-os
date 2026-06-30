"use client";

import {createContext, useContext, useMemo} from "react";
import {getAllPlugins, getPluginNavItems, findPluginByPath} from "@/core/plugins/registry";
import type {PluginEntry, PluginNavItem} from "@/core/plugins/manifest";
import {getPlugin} from "@/core/plugins/registry";

interface PluginContextValue {
  plugins: PluginEntry[];
  navItems: Pick<PluginNavItem, "key" | "href" | "slot">[];
  findFeature(pathname: string): PluginEntry | null;
  isEnabled(id: string): boolean;
}

const PluginContext = createContext<PluginContextValue | null>(null);

export function PluginProvider({children}: {children: React.ReactNode}) {
  const value = useMemo<PluginContextValue>(() => {
    const plugins = getAllPlugins();
    const navItems = getPluginNavItems();

    return {
      plugins,
      navItems,
      findFeature(pathname: string) {
        return findPluginByPath(pathname);
      },
      isEnabled(id: string) {
        const plugin = getPlugin(id as Parameters<typeof getPlugin>[0]);
        return plugin?.state === "enabled";
      },
    };
  }, []);

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePlugin() {
  const ctx = useContext(PluginContext);
  if (!ctx) {
    throw new Error("usePlugin must be used within a PluginProvider");
  }
  return ctx;
}

export function usePluginSlot(slot: string) {
  const {navItems} = usePlugin();
  return navItems.filter((item) => item.slot === slot);
}

export function usePluginNavItems() {
  return usePlugin().navItems;
}
