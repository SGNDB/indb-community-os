export type PlatformEventName =
  | "idea.created"
  | "idea.voted"
  | "idea.completed"
  | "memory.published"
  | "memory.saved"
  | "memory.reacted"
  | "graatek.requested"
  | "graatek.completed"
  | "donation.created"
  | "donation.verified"
  | "volunteer.joined"
  | "volunteer.completed"
  | "message.sent"
  | "feed.posted"
  | "feed.commented"
  | "recognition.awarded"
  | "settings.updated";

export interface PlatformEventPayload {
  name: PlatformEventName;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export async function publishPlatformEvent(event: PlatformEventPayload) {
  // Phase 3 foundation: keep this side-effect free until notification,
  // analytics, recognition, and activity-feed subscribers are added.
  return {
    ...event,
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  };
}

