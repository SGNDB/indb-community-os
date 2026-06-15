import {
  normalizeMauritaniaPhone,
  toSyntheticPhoneEmail
} from "./phone-auth";

const DEFAULT_COUNTRY_CODE = "+222";
const PHONE_DOMAIN = "phone.indb.local";

export { normalizeMauritaniaPhone, toSyntheticPhoneEmail };

export const normalizePhone = normalizeMauritaniaPhone;
export const phoneToEmail = toSyntheticPhoneEmail;

export function isValidMauritaniaPhone(phone: string): boolean {
  try {
    const normalized = normalizeMauritaniaPhone(phone);
    const local = normalized.slice(4);
    const prefix = local.slice(0, 2);
    const validPrefixes = [
      "22","23","24","25","26","27","28","29",
      "30","31","32","33","34","35","36","37","38","39",
      "40","41","42","43","44","45","46","47","48","49",
    ];
    return validPrefixes.includes(prefix);
  } catch {
    return false;
  }
}

export function emailToPhone(email: string): string | null {
  const match = email.match(/^(\d+)@phone\.indb\.local$/);
  if (!match) return null;
  return "+" + match[1];
}

export function formatPhone(phone: string): string {
  try {
    const normalized = normalizeMauritaniaPhone(phone);
    const local = normalized.slice(4);
    const pairs = local.match(/.{1,2}/g) || [];
    return "+222 " + pairs.join(" ");
  } catch {
    return phone;
  }
}

export function isSyntheticEmail(email: string): boolean {
  return email.endsWith(`@${PHONE_DOMAIN}`);
}

export { DEFAULT_COUNTRY_CODE, PHONE_DOMAIN };
