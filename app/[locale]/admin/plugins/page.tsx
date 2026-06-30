import {getTranslations} from "next-intl/server";
import {getAllPlugins} from "@/core/plugins/registry";
import {AdminPluginsClient} from "./admin-plugins-client";
import {getPluginStates} from "./actions";

export default async function AdminPluginsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const dbStates = await getPluginStates();

  const plugins = getAllPlugins().map((entry) => {
    const dbState = dbStates[entry.manifest.id];
    const effectiveState = dbState === "disabled" ? "disabled" : entry.state;
    return {
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      state: effectiveState,
      navKey: entry.manifest.nav?.key ?? null,
      routePrefixes: entry.manifest.routePrefixes.join(", "),
    };
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("nav.plugins")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage platform plugins — enable, disable, and configure them.
        </p>
      </div>
      <AdminPluginsClient plugins={plugins} />
    </div>
  );
}
