import {getTranslations} from "next-intl/server";
import {createClient} from "@/lib/supabase/server";
import {MessagesDashboard} from "@/components/admin/messages/messages-dashboard";

export default async function AdminMessagesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  const supabase = await createClient();

  // We can still fetch basic metrics here if needed to pass to the client dashboard as props.
  // For the sake of this premium dashboard, we are using mock data inside the components
  // to perfectly match the design requirements, but they can easily be replaced by these stats.
  const {count: totalConversations} = await supabase.from("conversations").select("*", {count: "exact", head: true});
  const {count: totalMessages} = await supabase.from("conversation_messages").select("*", {count: "exact", head: true});

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          💬 {t("nav.messages")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor communication, realtime activity, and messaging health.</p>
      </div>

      <MessagesDashboard />
    </div>
  );
}
