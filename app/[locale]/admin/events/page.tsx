import {getTranslations} from "next-intl/server";
import {AdminPageLayout} from "@/components/admin/ui/admin-page-layout";
import {AdminEventLogsClient} from "./admin-event-logs-client";
import {getAdminEventLogs} from "./actions";

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const logs = await getAdminEventLogs(200);

  return (
    <AdminPageLayout
      title={t("nav.events")}
      subtitle={t("events.subtitle")}
      breadcrumbs={[
        {label: t("nav.dashboard"), href: `/${locale}/admin`},
        {label: t("nav.events"), href: `/${locale}/admin/events`},
      ]}
    >
      <AdminEventLogsClient logs={logs} />
    </AdminPageLayout>
  );
}
