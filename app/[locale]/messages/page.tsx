import { createClient } from "@/lib/supabase/server";
import { getUserConversations } from "@/lib/data/conversations";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageSquare } from "lucide-react";

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let conversations: Awaited<ReturnType<typeof getUserConversations>> = [];
  let currentUserId = "";
  if (user) {
    currentUserId = user.id;
    conversations = await getUserConversations(user.id);
  }

  return (
    <>
      <div className="flex w-full flex-col md:w-[380px] md:shrink-0 md:border-r md:border-border/70">
        <ConversationList initialConversations={conversations} currentUserId={currentUserId} />
      </div>

      {/* Desktop empty state */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="text-center text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{locale === "ar" ? "اختر محادثة" : "Select a conversation"}</p>
          <p className="mt-1 text-sm">
            {locale === "ar"
              ? "اختر محادثة من القائمة لعرض الرسائل"
              : "Choose a conversation from the list to view messages"}
          </p>
        </div>
      </div>
    </>
  );
}
