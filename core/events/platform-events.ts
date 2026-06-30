import {getPluginEventNames} from "@/core/plugins/registry";

export type PlatformEventName = ReturnType<typeof getPluginEventNames>[number];

export interface PlatformEventPayload {
  name: PlatformEventName;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

type EventHandler = (event: PlatformEventPayload) => void | Promise<void>;

const _subscribers = new Map<PlatformEventName, Set<EventHandler>>();

export function subscribeToPlatformEvent(
  eventName: PlatformEventName,
  handler: EventHandler,
): () => void {
  if (!_subscribers.has(eventName)) {
    _subscribers.set(eventName, new Set());
  }
  _subscribers.get(eventName)!.add(handler);

  return () => {
    _subscribers.get(eventName)?.delete(handler);
  };
}

export async function publishPlatformEvent(event: PlatformEventPayload) {
  const enriched = {
    ...event,
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  };

  const handlers = _subscribers.get(enriched.name);
  if (handlers) {
    for (const handler of handlers) {
      try {
        await handler(enriched);
      } catch (error) {
        console.error(`[PlatformEvent] Subscriber failed for "${enriched.name}":`, error);
      }
    }
  }

  return enriched;
}

export function clearEventSubscribers(): void {
  _subscribers.clear();
}
