"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {GlassCard, StatusBadge} from "@/components/admin/admin-shared";
import * as actions from "./actions";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  state: "enabled" | "disabled";
  navKey: string | null;
  routePrefixes: string[];
}

export function AdminPluginsClient({plugins}: {plugins: Plugin[]}) {
  const t = useTranslations("Admin.plugins");
  const [loading, setLoading] = useState<string | null>(null);
  const [pluginStates, setPluginStates] = useState<Record<string, "enabled" | "disabled">>(
    Object.fromEntries(plugins.map((p) => [p.id, p.state])),
  );

  const handleToggle = async (pluginId: string, newState: "enabled" | "disabled") => {
    const previousState = pluginStates[pluginId] ?? "disabled";
    setLoading(pluginId);
    setPluginStates((prev) => ({...prev, [pluginId]: newState}));

    try {
      await actions.togglePluginState(pluginId, newState);
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
      setPluginStates((prev) => ({...prev, [pluginId]: previousState}));
      alert(error instanceof Error ? error.message : "Failed to toggle plugin");
    } finally {
      setLoading(null);
    }
  };

  if (plugins.length === 0) {
    return (
      <GlassCard className="p-10 text-center text-sm text-muted-foreground">
        {t("empty")}
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {plugins.map((plugin) => {
        const currentState = pluginStates[plugin.id] ?? plugin.state;
        const isLoading = loading === plugin.id;

        return (
          <GlassCard key={plugin.id} className="flex min-h-[300px] flex-col p-6">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{plugin.name}</h3>
                  {plugin.navKey && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("navLabel")}: <span dir="ltr">{plugin.navKey}</span>
                    </p>
                  )}
                </div>
                <StatusBadge
                  status={currentState === "enabled" ? "healthy" : "critical"}
                  label={currentState === "enabled" ? t("state.enabled") : t("state.disabled")}
                />
              </div>

              <p className="mt-3 text-sm text-muted-foreground">{plugin.description}</p>
              <p className="mt-3 text-xs text-muted-foreground" dir="ltr">
                {t("columns.version")} {plugin.version}
              </p>

              {plugin.routePrefixes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{t("columns.routes")}</p>
                  <div className="flex flex-wrap gap-1">
                    {plugin.routePrefixes.map((prefix) => (
                      <code
                        key={prefix}
                        className="rounded bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground"
                        dir="ltr"
                      >
                        {prefix}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggle(plugin.id, "enabled")}
                disabled={isLoading || currentState === "enabled"}
                className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                  currentState === "enabled"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isLoading ? "..." : "ON"}
              </button>
              <button
                type="button"
                onClick={() => handleToggle(plugin.id, "disabled")}
                disabled={isLoading || currentState === "disabled"}
                className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                  currentState === "disabled"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isLoading ? "..." : "OFF"}
              </button>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
