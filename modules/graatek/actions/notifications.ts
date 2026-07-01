import {createNotification} from "@/lib/data/notifications";

export async function createGraatekRequestNotification(params: {
  ownerId: string;
  requesterId: string;
  shareId: string;
  requestId: string;
}) {
  return createNotification({
    userId: params.ownerId,
    actorId: params.requesterId,
    type: "fadla_request",
    entityType: "community_share",
    entityId: params.shareId,
    title: "New Graatek request",
    metadata: {
      shareId: params.shareId,
      requestId: params.requestId,
      requesterId: params.requesterId,
    },
  });
}

export async function createGraatekRequestAcceptedNotification(params: {
  requesterId: string;
  ownerId: string;
  shareId: string;
  conversationId?: string;
}) {
  return createNotification({
    userId: params.requesterId,
    actorId: params.ownerId,
    type: "fadla_request_accepted",
    entityType: "community_share",
    entityId: params.shareId,
    title: params.conversationId ? "requestAcceptedMessage" : "Your request was accepted",
    metadata: params.conversationId ? {conversationId: params.conversationId} : undefined,
  });
}

export async function createGraatekReceiverConfirmedNotification(params: {
  ownerId: string;
  receiverId: string;
  shareId: string;
  title: string;
  bothConfirmed: boolean;
}) {
  return createNotification({
    userId: params.ownerId,
    actorId: params.receiverId,
    type: params.bothConfirmed ? "fadla_both_completed" : "fadla_receiver_confirmed",
    entityType: "community_share",
    entityId: params.shareId,
    title: params.title,
  });
}

export async function createGraatekSenderConfirmedNotification(params: {
  requesterId: string;
  ownerId: string;
  shareId: string;
  title: string;
  bothConfirmed: boolean;
}) {
  return createNotification({
    userId: params.requesterId,
    actorId: params.ownerId,
    type: params.bothConfirmed ? "fadla_both_completed" : "fadla_sender_confirmed",
    entityType: "community_share",
    entityId: params.shareId,
    title: params.title,
  });
}

export async function createGraatekRequestDeclinedNotification(params: {
  requesterId: string;
  ownerId: string;
  shareId: string;
}) {
  return createNotification({
    userId: params.requesterId,
    actorId: params.ownerId,
    type: "fadla_request_declined",
    entityType: "community_share",
    entityId: params.shareId,
    title: "Your Graatek request was declined",
  });
}

export async function createGraatekMessageNotification(params: {
  recipientId: string;
  senderId: string;
  shareId: string;
  requestId: string;
  messagePreview: string;
}) {
  return createNotification({
    userId: params.recipientId,
    actorId: params.senderId,
    type: "fadla_message",
    entityType: "community_share",
    entityId: params.shareId,
    title: "sent you a message about Graatek",
    metadata: {
      requestId: params.requestId,
      message: params.messagePreview,
      senderId: params.senderId,
    },
  });
}

export async function createGraatekShareNotification(params: {
  ownerId: string;
  actorId: string;
  shareId: string;
}) {
  return createNotification({
    userId: params.ownerId,
    actorId: params.actorId,
    type: "share",
    entityType: "community_share",
    entityId: params.shareId,
    title: "Shared your item",
  });
}
