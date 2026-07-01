import {unstable_noStore as noStore} from "next/cache";

import {getAdminFeatureFlags} from "@/lib/data/admin";
import {CORE_FEATURES, PLATFORM_FEATURES, type PlatformFeatureId} from "@/core/features/registry";

function readFlag(flags: Record<string, boolean>, flag?: string) {
  if (!flag) return true;
  return flags[flag] !== false;
}

function findFeature(featureId: PlatformFeatureId) {
  return PLATFORM_FEATURES.find((feature) => feature.id === featureId);
}

export async function getFeatureRuntime() {
  noStore();
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
  noStore();
  const runtime = await getFeatureRuntime();
  return runtime.enabledFeatureIds.includes(featureId);
}

export async function assertFeatureEnabled(featureId: PlatformFeatureId) {
  noStore();
  if (await isFeatureEnabled(featureId)) return;
  throw new Error(`module_disabled:${featureId}`);
}

export async function assertFeatureEnabledForMutation(featureId: PlatformFeatureId) {
  noStore();
  const feature = findFeature(featureId);
  if (!feature) throw new Error(`module_unknown:${featureId}`);
  if (!feature.featureFlag) return;

  try {
    const flags = await getAdminFeatureFlags({strict: true});
    if (readFlag(flags as unknown as Record<string, boolean>, feature.featureFlag)) return;
  } catch {
    throw new Error(`module_disabled:${featureId}`);
  }

  throw new Error(`module_disabled:${featureId}`);
}

export async function getEnabledNavigationKeys() {
  const runtime = await getFeatureRuntime();
  return runtime.enabledNavigationKeys;
}

export function isCoreFeature(featureId: PlatformFeatureId) {
  return CORE_FEATURES.some((feature) => feature.id === featureId);
}
