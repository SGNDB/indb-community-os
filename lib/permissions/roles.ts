import type {AppRole} from "@/lib/i18n/routing";

const roleRank: Record<AppRole, number> = {
  visitor: 0,
  member: 1,
  contributor: 2,
  historian: 3,
  moderator: 4,
  admin: 5,
};

export function hasMinimumRole(role: AppRole | null | undefined, minimum: AppRole) {
  if (!role) {
    return false;
  }

  return roleRank[role] >= roleRank[minimum];
}

export function isAdminLike(role: AppRole | null | undefined) {
  return hasMinimumRole(role, "moderator");
}


