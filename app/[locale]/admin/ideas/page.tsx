import {getTranslations} from "next-intl/server";
import {getAdminIdeas} from "@/lib/data/admin";
import {AdminIdeasClient} from "./admin-ideas-client";

export default async function AdminIdeasPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const ideas = await getAdminIdeas();

  const statusCounts = {
    all: ideas.length,
    published: ideas.filter((i) => i.status === "published").length,
    in_progress: ideas.filter((i) => ["interested", "discussion", "in_progress"].includes(i.status)).length,
    completed: ideas.filter((i) => i.status === "completed").length,
    archived: ideas.filter((i) => i.status === "archived").length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.ideas")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all community ideas</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(statusCounts).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-border/60 bg-card px-4 py-2">
            <p className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</p>
            <p className="text-lg font-bold text-foreground">{count}</p>
          </div>
        ))}
      </div>

      <AdminIdeasClient locale={locale} initialIdeas={ideas} />
    </div>
  );
}
