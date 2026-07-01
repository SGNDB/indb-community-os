import type {CorePermission, Permission} from "@/core/plugins/manifest";
import {getPlugin} from "@/core/plugins/registry";
import type {AppRole} from "@/lib/i18n/routing";
import {hasMinimumRole} from "@/lib/permissions/roles";

const coreRolePermissions: Record<CorePermission, AppRole> = {
  "public.read": "visitor",
  "member.read": "member",
  "member.write": "member",
  "owner.manage": "contributor",
  "admin.manage": "moderator",
};

const moduleRolePermissions: Partial<Record<Permission, AppRole>> = {
  "graatek.read": "visitor",
  "graatek.write": "member",
  "graatek.request": "member",
  "graatek.message": "member",
  "graatek.complete": "member",
  "graatek.manage": "moderator",
  "memories.read": "visitor",
  "memories.write": "member",
  "memories.comment": "member",
  "memories.react": "member",
  "memories.save": "member",
  "memories.manage": "moderator",
};

export function hasPluginPermission(
  role: AppRole | null | undefined,
  permission: Permission,
): boolean {
  const minimumRole =
    moduleRolePermissions[permission] ?? coreRolePermissions[permission as CorePermission];
  return hasMinimumRole(role, minimumRole);
}

export function assertPluginPermission(
  role: AppRole | null | undefined,
  permission: Permission,
): void {
  if (!hasPluginPermission(role, permission)) {
    throw new Error(`permission_denied:${permission}`);
  }
}

export function usePluginPermission(
  role: AppRole | null | undefined,
  pluginId: string,
): {
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  canAdmin: boolean;
} {
  const plugin = getPlugin(pluginId as Parameters<typeof getPlugin>[0]);
  const perms = plugin?.manifest.permissions ?? [];

  return {
    canRead: perms.some((p) => p === "public.read" || p === "member.read"),
    canWrite: perms.some((p) => p === "member.write"),
    canManage: perms.some((p) => p === "owner.manage"),
    canAdmin: perms.some((p) => p === "admin.manage"),
  };
}
