export type ContentLanguage = "ar" | "fr" | "en";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;
const FRENCH_ACCENT_PATTERN =
  /[\u00e0\u00e2\u00e6\u00e7\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u0153\u00f9\u00fb\u00fc\u00ff]/i;
const FRENCH_WORD_PATTERN =
  /\b(le|la|les|des|du|de|une|un|et|avec|pour|dans|sur|bonjour|merci|cette|ce|cet)\b/i;

export function detectContentLanguage(text: string): ContentLanguage {
  const normalized = text.trim();

  if (!normalized) {
    return "en";
  }

  if (ARABIC_TEXT_PATTERN.test(normalized)) {
    return "ar";
  }

  if (FRENCH_ACCENT_PATTERN.test(normalized) || FRENCH_WORD_PATTERN.test(normalized)) {
    return "fr";
  }

  return "en";
}
