import { createClient } from '@/lib/supabase/server';

export type ConversationMessageType = 'text' | 'image';
export type ConversationParticipantRole = 'admin' | 'member';

export interface ConversationUserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ConversationParticipantInfo {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationParticipantRole;
  last_read_at: string | null;
  unread_count: number;
  left_at: string | null;
  removed_at: string | null;
  removed_by: string | null;
  created_at: string | null;
  user: ConversationUserProfile | null;
}

export interface ConversationMessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string | null;
  message_type: ConversationMessageType;
  image_url: string | null;
  image_storage_path: string | null;
  created_at: string;
  read_at: string | null;
  sender: ConversationUserProfile | null;
}

export interface ConversationListItem {
  id: string;
  type: string;
  graatek_id: string | null;
  idea_id: string | null;
  title: string;
  image_url: string | null;
  image_storage_path: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string | null;
  idea_title: string | null;
  idea_status: string | null;
  member_count: number;
  last_message: {
    message: string | null;
    message_type: ConversationMessageType;
    image_url: string | null;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
  other_participant: ConversationUserProfile | null;
}

export interface ConversationDetails {
  id: string;
  type: string;
  graatek_id: string | null;
  idea_id: string | null;
  title: string;
  image_url: string | null;
  image_storage_path: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string | null;
  idea_title: string | null;
  idea_status: string | null;
  member_count: number;
  participants: ConversationParticipantInfo[];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function normalizeMessageType(value: unknown): ConversationMessageType {
  return value === 'image' ? 'image' : 'text';
}

function mapInboxRow(row: Record<string, unknown>): ConversationListItem {
  const lastMessageAt = asString(row.last_message_at);

  return {
    id: row.id as string,
    type: row.type as string,
    graatek_id: asString(row.graatek_id),
    idea_id: asString(row.idea_id),
    title: (row.title as string) ?? '',
    image_url: asString(row.image_url),
    image_storage_path: asString(row.image_storage_path),
    archived_at: asString(row.archived_at),
    created_at: row.created_at as string,
    updated_at: asString(row.updated_at),
    idea_title: asString(row.idea_title),
    idea_status: asString(row.idea_status),
    member_count: asNumber(row.member_count),
    last_message: lastMessageAt
      ? {
          message: asString(row.last_message_text),
          message_type: normalizeMessageType(row.last_message_type),
          image_url: asString(row.last_message_image_url),
          created_at: lastMessageAt,
          sender_id: row.last_message_sender_id as string,
        }
      : null,
    unread_count: asNumber(row.unread_count),
    other_participant: row.other_user_id
      ? {
          id: row.other_user_id as string,
          username: asString(row.other_username),
          full_name: asString(row.other_full_name),
          avatar_url: asString(row.other_avatar_url),
        }
      : null,
  };
}

export async function getUserConversations(userId: string): Promise<ConversationListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_inbox', { p_user_id: userId });
  if (error) {
    console.error('getUserConversations error:', error);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapInboxRow);
}

export async function getConversationById(
  conversationId: string,
  userId?: string,
): Promise<ConversationDetails | null> {
  const supabase = await createClient();

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (convError) {
    console.error('getConversationById conversation error:', convError);
    return null;
  }
  if (!conv) return null;

  const { data: participants, error: participantsError } = await supabase
    .from('conversation_participants')
    .select('*, user:user_id(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .is('left_at', null)
    .is('removed_at', null)
    .order('role', { ascending: true })
    .order('created_at', { ascending: true });

  if (participantsError) {
    console.error('getConversationById participants error:', participantsError);
    return null;
  }

  const activeParticipants = (participants ?? []) as unknown as ConversationParticipantInfo[];
  if (userId && !activeParticipants.some((p) => p.user_id === userId)) {
    return null;
  }

  let ideaTitle: string | null = null;
  let ideaStatus: string | null = null;
  if (conv.idea_id) {
    const { data: idea } = await supabase
      .from('ideas')
      .select('title, status')
      .eq('id', conv.idea_id)
      .maybeSingle();
    ideaTitle = idea?.title ?? null;
    ideaStatus = idea?.status ?? null;
  }

  return {
    id: conv.id,
    type: conv.type,
    graatek_id: conv.graatek_id,
    idea_id: conv.idea_id,
    title: conv.title,
    image_url: conv.image_url ?? null,
    image_storage_path: conv.image_storage_path ?? null,
    archived_at: conv.archived_at,
    created_at: conv.created_at,
    updated_at: conv.updated_at ?? null,
    idea_title: ideaTitle,
    idea_status: ideaStatus,
    member_count: activeParticipants.length,
    participants: activeParticipants,
  };
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ConversationMessageWithSender[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*, sender:sender_id(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getConversationMessages error:', error);
    return [];
  }

  return ((data ?? []) as unknown as ConversationMessageWithSender[]).map((message) => ({
    ...message,
    message: message.message ?? null,
    message_type: normalizeMessageType(message.message_type),
    image_url: message.image_url ?? null,
    image_storage_path: message.image_storage_path ?? null,
  }));
}

export async function sendConversationMessage(
  conversationId: string,
  senderId: string,
  input: string | {
    message?: string | null;
    messageType?: ConversationMessageType;
    imageUrl?: string | null;
    imageStoragePath?: string | null;
  },
): Promise<{ id: string; created_at: string } | null> {
  const supabase = await createClient();
  const isTextInput = typeof input === 'string';
  const messageType = isTextInput ? 'text' : input.messageType ?? (input.imageUrl ? 'image' : 'text');
  const message = (isTextInput ? input : input.message ?? '').trim();
  const imageUrl = isTextInput ? null : input.imageUrl ?? null;
  const imageStoragePath = isTextInput ? null : input.imageStoragePath ?? null;

  if (messageType === 'text' && !message) return null;
  if (messageType === 'image' && (!imageUrl || !imageStoragePath)) return null;

  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: message || null,
      message_type: messageType,
      image_url: imageUrl,
      image_storage_path: imageStoragePath,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('sendConversationMessage error:', error);
    return null;
  }

  const { error: rpcError } = await supabase.rpc('increment_conv_unread', {
    p_conv_id: conversationId,
    p_except_user: senderId,
  });
  if (rpcError) console.error('increment unread error:', rpcError);

  return data;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conv_id: conversationId,
    p_user_id: userId,
  });
  if (error) console.error('markConversationRead error:', error);
}

export async function searchUserConversations(
  userId: string,
  query: string,
): Promise<ConversationListItem[]> {
  const conversations = await getUserConversations(userId);
  const q = query.trim().toLowerCase();
  if (!q) return conversations;

  return conversations.filter((conversation) => {
    const otherName = (
      conversation.other_participant?.full_name ??
      conversation.other_participant?.username ??
      ''
    ).toLowerCase();
    const title = conversation.title.toLowerCase();
    const ideaTitle = (conversation.idea_title ?? '').toLowerCase();
    return otherName.includes(q) || title.includes(q) || ideaTitle.includes(q);
  });
}

export async function getUnreadConversationsCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('conversation_participants')
    .select('unread_count')
    .eq('user_id', userId)
    .is('left_at', null)
    .is('removed_at', null);

  if (!data) return 0;
  return data.reduce((sum, p) => sum + (p.unread_count ?? 0), 0);
}

export async function ensureConversationExists(type: 'graatek' | 'idea', entityId: string): Promise<string | null> {
  const supabase = await createClient();

  if (type === 'graatek') {
    const { data, error } = await supabase.rpc('ensure_graatek_conversation', { p_share_id: entityId });
    if (error) {
      console.error('ensureConversationExists graatek error:', error);
      return null;
    }
    return data as string | null;
  }

  const { data, error } = await supabase.rpc('ensure_idea_conversation', { p_idea_id: entityId });
  if (error) {
    console.error('ensureConversationExists idea error:', error);
    return null;
  }
  return data as string | null;
}

export async function updateIdeaGroupProfile(
  conversationId: string,
  actorId: string,
  input: { title?: string | null; imageUrl?: string | null; imageStoragePath?: string | null },
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_idea_group_profile', {
    p_conv_id: conversationId,
    p_actor_id: actorId,
    p_title: input.title ?? null,
    p_image_url: input.imageUrl ?? null,
    p_image_storage_path: input.imageStoragePath ?? null,
  });

  if (error) {
    console.error('updateIdeaGroupProfile error:', error);
    return false;
  }
  return true;
}

export async function removeIdeaGroupMember(
  conversationId: string,
  actorId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('remove_idea_group_member', {
    p_conv_id: conversationId,
    p_actor_id: actorId,
    p_user_id: userId,
  });

  if (error) {
    console.error('removeIdeaGroupMember error:', error);
    return false;
  }
  return true;
}

export async function leaveIdeaGroup(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('leave_idea_group', {
    p_conv_id: conversationId,
    p_user_id: userId,
  });

  if (error) {
    console.error('leaveIdeaGroup error:', error);
    return false;
  }
  return true;
}
