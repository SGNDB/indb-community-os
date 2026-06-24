import {getTranslations} from "next-intl/server";
import {createClient} from "@/lib/supabase/server";

export default async function AdminMessagesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const supabase = await createClient();

  const {count: totalConversations} = await supabase.from("conversations").select("*", {count: "exact", head: true});
  const {count: totalMessages} = await supabase.from("conversation_messages").select("*", {count: "exact", head: true});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.messages")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Message moderation tools</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Conversations</p>
          <p className="mt-1 text-3xl font-black text-foreground">{totalConversations ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Messages</p>
          <p className="mt-1 text-3xl font-black text-foreground">{totalMessages ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Reported messages and conversations moderation will appear here.</p>
      </div>
    </div>
  );
}
