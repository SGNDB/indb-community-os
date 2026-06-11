export type ContentLanguage = "ar" | "fr" | "en" | "wo" | "ff" | "snk";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;
const FRENCH_ACCENT_PATTERN =
  /[\u00e0\u00e2\u00e6\u00e7\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u0153\u00f9\u00fb\u00fc\u00ff]/i;
const FRENCH_WORD_PATTERN =
  /\b(le|la|les|des|du|de|une|un|et|avec|pour|dans|sur|bonjour|merci|cette|ce|cet)\b/i;

const FULA_CHAR_PATTERN = /[\u0253\u0257\u01b4]/;
const WOLOF_PATTERN = /[\u00f1\u00eb\u014b]/;
const WOLOF_WORD_PATTERN =
  /\b(wax|def|bëgg|mana|naka|soxla|jëm|jàng|tëgg|xarit|mbokk|jigéen|góor|waa|néeg|kër|tànk|bànna|gàdda)\b/i;

const SONINKE_WORD_PATTERN =
  /\b(suxu|kille|yugo|kuta|xure|kome|yaxo|tomo|sene|kabi|maru|naxa)\b/i;

export function detectContentLanguage(text: string): ContentLanguage {
  const normalized = text.trim();

  if (!normalized) {
    return "en";
  }

  if (ARABIC_TEXT_PATTERN.test(normalized)) {
    return "ar";
  }

  if (FULA_CHAR_PATTERN.test(normalized)) {
    return "ff";
  }

  if (WOLOF_PATTERN.test(normalized) || WOLOF_WORD_PATTERN.test(normalized)) {
    return "wo";
  }

  if (SONINKE_WORD_PATTERN.test(normalized)) {
    return "snk";
  }

  if (FRENCH_ACCENT_PATTERN.test(normalized) || FRENCH_WORD_PATTERN.test(normalized)) {
    return "fr";
  }

  return "en";
}
