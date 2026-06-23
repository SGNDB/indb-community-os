import { createClient } from "@/lib/supabase/server";
import { getConversationById, getConversationMessages, getUserConversations } from "@/lib/data/conversations";
import { ConversationList } from "@/components/messages/conversation-list";
import { ConversationChat } from "@/components/messages/conversation-chat";
import { notFound, redirect } from "next/navigation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const conversation = await getConversationById(id);
  if (!conversation) notFound();

  const isParticipant = conversation.participants.some((p) => p.user_id === user.id);
  if (!isParticipant) notFound();

  const messages = await getConversationMessages(id);

  const otherParticipant = conversation.participants.find((p) => p.user_id !== user.id);
  const otherName = otherParticipant?.user?.full_name ?? otherParticipant?.user?.username ?? "?";
  const otherAvatarUrl = otherParticipant?.user?.avatar_url ?? null;

  const conversations = await getUserConversations(user.id);

  return (
    <>
      {/* Desktop: conversation list */}
      <div className="hidden w-[380px] shrink-0 border-r border-border/70 md:flex md:flex-col">
        <ConversationList initialConversations={conversations} currentUserId={user.id} />
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col">
        <ConversationChat
          conversationId={id}
          initialMessages={messages}
          currentUserId={user.id}
          otherUserName={otherName}
          otherUserAvatarUrl={otherAvatarUrl}
          isArchived={!!conversation.archived_at}
          conversationTitle={conversation.title}
          conversationType={conversation.type}
        />
      </div>
    </>
  );
}
