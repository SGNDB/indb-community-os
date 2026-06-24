import {getTranslations} from "next-intl/server";
import {getAdminMemories} from "@/lib/data/admin";
import {AdminMemoriesClient} from "./admin-memories-client";

export default async function AdminMemoriesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const memories = await getAdminMemories();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.memories")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage community memories</p>
      </div>

      <AdminMemoriesClient initialMemories={memories} />
    </div>
  );
}
