import { subscribeToPlatformEvent } from '@/core/events/platform-events';
import type { PlatformEventPayload } from '@/core/events/platform-events';
import { createAdminClient } from '@/lib/supabase/admin';

async function refreshCommunityImpact(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin.rpc('refresh_community_impact_for_user', { p_user_id: userId });
  } catch (err) {
    console.error('[Recognition] Failed to refresh community impact:', err);
  }
}

export function registerRecognitionSubscriber(): void {
  subscribeToPlatformEvent('donation.verified' as any, async (event: PlatformEventPayload) => {
    if (!event.actorId) return;
    await refreshCommunityImpact(event.actorId);
  });

  subscribeToPlatformEvent('graatek.completed' as any, async (event: PlatformEventPayload) => {
    if (!event.actorId) return;
    await refreshCommunityImpact(event.actorId);
  });

  subscribeToPlatformEvent('idea.completed' as any, async (event: PlatformEventPayload) => {
    if (!event.actorId) return;
    await refreshCommunityImpact(event.actorId);
  });

  subscribeToPlatformEvent('memory.published' as any, async (event: PlatformEventPayload) => {
    if (!event.actorId) return;
    await refreshCommunityImpact(event.actorId);
  });
}
