import {getTranslations} from "next-intl/server";
import {AdminPageLayout} from "@/components/admin/ui/admin-page-layout";
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
    const effectiveState: "enabled" | "disabled" =
      dbState === "disabled" ? "disabled" : entry.state === "enabled" ? "enabled" : "disabled";
    const itemKey = `plugins.items.${entry.manifest.id}`;
    return {
      id: entry.manifest.id,
      name: t.has(`${itemKey}.name`) ? t(`${itemKey}.name`) : entry.manifest.name,
      version: entry.manifest.version,
      description: t.has(`${itemKey}.description`) ? t(`${itemKey}.description`) : entry.manifest.description,
      state: effectiveState,
      navKey: entry.manifest.nav?.key ?? null,
      routePrefixes: entry.manifest.routePrefixes,
    };
  });

  return (
    <AdminPageLayout
      title={t("nav.plugins")}
      subtitle={t("plugins.subtitle")}
      breadcrumbs={[
        {label: t("nav.dashboard"), href: `/${locale}/admin`},
        {label: t("nav.plugins"), href: `/${locale}/admin/plugins`},
      ]}
    >
      <AdminPluginsClient plugins={plugins} />
    </AdminPageLayout>
  );
}
