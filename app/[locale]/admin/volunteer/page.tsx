import {getTranslations} from "next-intl/server";
import {createClient} from "@/lib/supabase/server";

export default async function AdminVolunteerPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const supabase = await createClient();

  const {data: campaigns} = await supabase
    .from("support_campaigns")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(20);

  const totalVolunteers = (campaigns ?? []).reduce((sum, c: {volunteers_count?: number}) => sum + (c.volunteers_count ?? 0), 0);
  const activeCount = (campaigns ?? []).filter((c: {status: string}) => c.status === "active").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.volunteer")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage volunteer opportunities</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Opportunities</p>
          <p className="mt-1 text-2xl font-black text-foreground">{campaigns?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-black text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Volunteers</p>
          <p className="mt-1 text-2xl font-black text-foreground">{totalVolunteers}</p>
        </div>
      </div>

      <div className="space-y-2">
        {(campaigns ?? []).map((campaign: {id: string; title: string; status: string; volunteers_count?: number; created_at: string}) => (
          <div key={campaign.id} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{campaign.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {campaign.volunteers_count ?? 0} volunteers · {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {campaign.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
