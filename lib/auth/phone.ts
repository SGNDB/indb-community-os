const DEFAULT_COUNTRY_CODE = "+222";
const PHONE_DOMAIN = "phone.indb.local";

function stripNonDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function normalizePhone(input: string): string {
  const digits = stripNonDigits(input);
  if (digits.startsWith("222")) {
    return "+" + digits;
  }
  return DEFAULT_COUNTRY_CODE + digits;
}

export function isValidMauritaniaPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized.startsWith(DEFAULT_COUNTRY_CODE)) return false;
  const local = normalized.slice(4);
  if (local.length !== 8) return false;
  if (!/^\d{8}$/.test(local)) return false;
  const prefix = local.slice(0, 2);
  const validPrefixes = [
    "22","23","24","25","26","27","28","29",
    "30","31","32","33","34","35","36","37","38","39",
    "40","41","42","43","44","45","46","47","48","49",
  ];
  return validPrefixes.includes(prefix);
}

export function phoneToEmail(phone: string): string {
  const normalized = normalizePhone(phone);
  const localPart = stripNonDigits(normalized);
  return `${localPart}@${PHONE_DOMAIN}`;
}

export function emailToPhone(email: string): string | null {
  const match = email.match(/^(\d+)@phone\.indb\.local$/);
  if (!match) return null;
  return "+" + match[1];
}

export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const local = normalized.slice(4);
  const pairs = local.match(/.{1,2}/g) || [];
  return "+222 " + pairs.join(" ");
}

export function isSyntheticEmail(email: string): boolean {
  return email.endsWith(`@${PHONE_DOMAIN}`);
}

export { DEFAULT_COUNTRY_CODE, PHONE_DOMAIN };
