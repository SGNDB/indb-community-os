import { subscribeToPlatformEvent } from '@/core/events/platform-events';
import type { PlatformEventPayload } from '@/core/events/platform-events';
import { createAdminClient } from '@/lib/supabase/admin';

type EventMapping = {
  eventType: string;
  referenceType: string;
};

const EVENT_MAP: Record<string, EventMapping> = {
  'donation.verified': { eventType: 'donation_verified', referenceType: 'support_contribution' },
  'idea.completed': { eventType: 'idea_completed', referenceType: 'idea' },
  'graatek.completed': { eventType: 'graatek_exchange_completed', referenceType: 'community_share' },
  'memory.published': { eventType: 'memory_published', referenceType: 'memory' },
};

export function registerImpactEventsSubscriber(): void {
  for (const [eventName, mapping] of Object.entries(EVENT_MAP)) {
    subscribeToPlatformEvent(eventName as any, async (event: PlatformEventPayload) => {
      try {
        const admin = createAdminClient();
        if (!admin) return;
        const { error } = await admin.from('impact_events').insert({
          user_id: event.actorId,
          event_type: mapping.eventType,
          reference_id: event.entityId,
          reference_type: mapping.referenceType,
          value: 1,
          description: `${event.name} — ${event.actorId ?? 'system'}`,
        });
        if (error && error.code !== '23505') {
          console.error(`[ImpactEvents] Insert failed for ${event.name}:`, error.message);
        }
      } catch (err) {
        console.error(`[ImpactEvents] Handler failed for ${event.name}:`, err);
      }
    });
  }
}
