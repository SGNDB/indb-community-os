import {createClient} from "@/lib/supabase/server";
import {getTranslations} from "next-intl/server";
import {AdminGraatekClient} from "./admin-graatek-client";

export default async function AdminGraatekPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const t = await getTranslations({locale, namespace: "Admin"});

  const {data: items} = await supabase
    .from("community_shares")
    .select("id, title, description, status, created_at, owner:profiles!community_shares_owner_id_fkey(id, full_name, username, avatar_url)")
    .order("created_at", {ascending: false})
    .limit(50);

  const graatekItems = (items ?? []).map((item: {id: string; title: string; description: string | null; status: string; created_at: string; owner: unknown}) => {
    const owner = Array.isArray(item.owner) ? (item.owner as Array<{id: string; full_name: string | null; username: string | null; avatar_url: string | null}>)[0] ?? null : (item.owner as {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null);
    return {id: item.id, title: item.title, description: item.description, status: item.status, created_at: item.created_at, owner};
  });

  const statusCounts = {
    all: graatekItems.length,
    active: graatekItems.filter((i) => i.status === "active").length,
    requested: graatekItems.filter((i) => i.status === "requested").length,
    reserved: graatekItems.filter((i) => i.status === "reserved").length,
    completed: graatekItems.filter((i) => i.status === "completed").length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.graatek")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all Graatek items</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(statusCounts).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-border/60 bg-card px-4 py-2">
            <p className="text-xs text-muted-foreground capitalize">{key}</p>
            <p className="text-lg font-bold text-foreground">{count}</p>
          </div>
        ))}
      </div>

      <AdminGraatekClient initialItems={graatekItems} />
    </div>
  );
}
