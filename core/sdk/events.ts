import {publishPlatformEvent} from "@/core/events/platform-events";
import type {PlatformEventName, PlatformEventPayload} from "@/core/events/platform-events";

export async function emitEvent(event: PlatformEventPayload) {
  return publishPlatformEvent(event);
}

export function getEventName(pluginId: string, action: string): PlatformEventName {
  return `${pluginId}.${action}` as PlatformEventName;
}

export type {PlatformEventName, PlatformEventPayload};
