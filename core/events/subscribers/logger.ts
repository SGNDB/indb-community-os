import { subscribeToPlatformEvent } from '@/core/events/platform-events';
import type { PlatformEventPayload } from '@/core/events/platform-events';
import { createAdminClient } from '@/lib/supabase/admin';

const ALL_EVENT_NAMES = [
  'idea.created',
  'idea.voted',
  'idea.completed',
  'memory.published',
  'memory.saved',
  'memory.reacted',
  'graatek.requested',
  'graatek.completed',
  'donation.created',
  'donation.verified',
  'volunteer.joined',
  'message.sent',
  'feed.posted',
  'feed.commented',
  'recognition.awarded',
  'settings.updated',
] as const;

const DEBUG_LOGS_ENABLED = process.env.ENABLE_EVENT_DEBUG_LOGS === 'true';

function safeLogPayload(event: PlatformEventPayload): string {
  return JSON.stringify({
    event: event.name,
    actorId: event.actorId,
    entityType: event.entityType,
    entityId: event.entityId,
    occurredAt: event.occurredAt,
  });
}

async function persistEventLog(event: PlatformEventPayload): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin.from('event_logs').insert({
      event_name: event.name,
      actor_id: event.actorId ?? null,
      entity_type: event.entityType,
      entity_id: event.entityId,
      metadata: { occurredAt: event.occurredAt },
    });
  } catch {
    // Non-critical — logging failure must never break the caller
  }
}

export function registerLoggerSubscriber(): void {
  for (const name of ALL_EVENT_NAMES) {
    subscribeToPlatformEvent(name as any, async (event: PlatformEventPayload) => {
      if (DEBUG_LOGS_ENABLED) {
        console.log('[PlatformEvent]', safeLogPayload(event));
      }
      await persistEventLog(event);
    });
  }
}
