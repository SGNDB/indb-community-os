import {getTranslations} from "next-intl/server";
import {AdminNotificationsClient} from "./admin-notifications-client";

export default async function AdminNotificationsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.notifications")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send platform announcements to users</p>
      </div>

      <AdminNotificationsClient locale={locale} />
    </div>
  );
}
