import {getAdminFeatureFlags} from "@/lib/data/admin";
import {CORE_FEATURES, PLATFORM_FEATURES, type PlatformFeatureId} from "@/core/features/registry";

function readFlag(flags: Record<string, boolean>, flag?: string) {
  if (!flag) return true;
  return flags[flag] !== false;
}

export async function getFeatureRuntime() {
  const flags = await getAdminFeatureFlags();
  const enabledFeatureIds = PLATFORM_FEATURES
    .filter((feature) => readFlag(flags as unknown as Record<string, boolean>, feature.featureFlag))
    .map((feature) => feature.id);

  const enabledNavigationKeys = PLATFORM_FEATURES
    .filter((feature) => feature.navKey && readFlag(flags as unknown as Record<string, boolean>, feature.featureFlag))
    .map((feature) => feature.navKey as string);

  return {
    flags,
    enabledFeatureIds,
    enabledNavigationKeys,
  };
}

export async function isFeatureEnabled(featureId: PlatformFeatureId) {
  const runtime = await getFeatureRuntime();
  return runtime.enabledFeatureIds.includes(featureId);
}

export async function assertFeatureEnabled(featureId: PlatformFeatureId) {
  if (await isFeatureEnabled(featureId)) return;
  throw new Error(`module_disabled:${featureId}`);
}

export async function getEnabledNavigationKeys() {
  const runtime = await getFeatureRuntime();
  return runtime.enabledNavigationKeys;
}

export function isCoreFeature(featureId: PlatformFeatureId) {
  return CORE_FEATURES.some((feature) => feature.id === featureId);
}

