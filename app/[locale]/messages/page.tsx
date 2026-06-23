import { createClient } from "@/lib/supabase/server";
import { getUserConversations } from "@/lib/data/conversations";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations({ locale, namespace: "Messages" });

  let conversations: Awaited<ReturnType<typeof getUserConversations>> = [];
  let currentUserId = "";
  if (user) {
    currentUserId = user.id;
    conversations = await getUserConversations(user.id);
  }

  return (
    <>
      <div className="flex w-full flex-col md:w-[30%] md:min-w-0 md:shrink-0 md:border-e md:border-border/70">
        <ConversationList initialConversations={conversations} currentUserId={currentUserId} />
      </div>

      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="text-center text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{t("selectConversation")}</p>
          <p className="mt-1 text-sm">{t("selectConversationHint")}</p>
        </div>
      </div>
    </>
  );
}
