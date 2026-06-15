import "server-only";

import { getAuthErrorKey } from '@/lib/auth/auth-error-map';

export function getLocalizedAuthError(
  error: { message?: string; code?: string } | null,
  t: (key: string) => string,
): string {
  if (!error) return t("auth_generic_error");
  const key = getAuthErrorKey(error);
  return t(key);
}
