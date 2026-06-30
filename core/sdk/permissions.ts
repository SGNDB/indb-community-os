import type {AppRole} from "@/lib/i18n/routing";
import {hasMinimumRole, isAdminLike} from "@/lib/permissions/roles";
import type {Permission} from "@/core/plugins/manifest";
import {hasPluginPermission, assertPluginPermission} from "@/core/plugins/permissions";

export function checkRole(role: AppRole | null | undefined, minimum: AppRole) {
  return hasMinimumRole(role, minimum);
}

export function checkAdmin(role: AppRole | null | undefined) {
  return isAdminLike(role);
}

export function checkPluginPermission(role: AppRole | null | undefined, permission: Permission) {
  return hasPluginPermission(role, permission);
}

export function requirePluginPermission(role: AppRole | null | undefined, permission: Permission) {
  assertPluginPermission(role, permission);
}

export type {AppRole, Permission};
