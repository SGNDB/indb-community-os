export interface SDKAnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export async function trackEvent(_event: SDKAnalyticsEvent): Promise<void> {
  // Phase 3: wire into analytics infrastructure
}

export async function trackPageView(_page: string, _properties?: Record<string, unknown>): Promise<void> {
  // Phase 3: wire into analytics infrastructure
}

export function getAnalytics() {
  return {trackEvent, trackPageView};
}
