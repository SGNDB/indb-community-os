import {getTranslations} from "next-intl/server";
import {getAdminReportedContent} from "@/lib/data/admin";
import {AdminModerationClient} from "./admin-moderation-client";

export default async function AdminModerationPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const reports = await getAdminReportedContent();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.moderation")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review reported content and take action</p>
      </div>

      <AdminModerationClient initialReports={reports} />
    </div>
  );
}
