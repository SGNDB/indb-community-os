import type {ContentLanguage} from "@/lib/i18n/detectContentLanguage";

export interface TranslateContentInput {
  text: string;
  sourceLang: ContentLanguage;
  targetLang: ContentLanguage;
}

export interface TranslateContentResult {
  translatedText: string;
  sourceLang: ContentLanguage;
  targetLang: ContentLanguage;
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

const translationDictionary: Record<
  ContentLanguage,
  Partial<Record<ContentLanguage, Record<string, string>>>
> = {
  en: {
    ar: {
      [normalizeText("Beach cleanup campaign starts this Saturday.")]:
        "\u062a\u0628\u062f\u0623 \u062d\u0645\u0644\u0629 \u062a\u0646\u0638\u064a\u0641 \u0627\u0644\u0634\u0627\u0637\u0626 \u0647\u0630\u0627 \u0627\u0644\u0633\u0628\u062a.",
      [normalizeText(
        "The beach cleanup campaign starts this Saturday at 8:00 AM. Bring gloves and water. Let's make our coastline shine.",
      )]:
        "\u062a\u0628\u062f\u0623 \u062d\u0645\u0644\u0629 \u062a\u0646\u0638\u064a\u0641 \u0627\u0644\u0634\u0627\u0637\u0626 \u0647\u0630\u0627 \u0627\u0644\u0633\u0628\u062a \u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629 8:00 \u0635\u0628\u0627\u062d\u064b\u0627. \u0623\u062d\u0636\u0631 \u0627\u0644\u0642\u0641\u0627\u0632\u0627\u062a \u0648\u0627\u0644\u0645\u0627\u0621. \u0644\u0646\u062c\u0639\u0644 \u0633\u0627\u062d\u0644\u0646\u0627 \u0623\u0643\u062b\u0631 \u0646\u0638\u0627\u0641\u0629.",
      [normalizeText(
        "We hosted a youth AI workshop this afternoon. The students asked for a weekly coding circle. Who can mentor?",
      )]:
        "\u0627\u0633\u062a\u0636\u0641\u0646\u0627 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0621 \u0648\u0631\u0634\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u0634\u0628\u0627\u0628. \u0637\u0644\u0628 \u0627\u0644\u0637\u0644\u0627\u0628 \u062d\u0644\u0642\u0629 \u0628\u0631\u0645\u062c\u0629 \u0623\u0633\u0628\u0648\u0639\u064a\u0629. \u0645\u0646 \u064a\u0645\u0643\u0646\u0647 \u0627\u0644\u0625\u0631\u0634\u0627\u062f\u061f",
      [normalizeText(
        "Found a set of historical railway photos from the late 1970s. Uploading them to the memory archive this week.",
      )]:
        "\u0639\u062b\u0631\u0646\u0627 \u0639\u0644\u0649 \u0645\u062c\u0645\u0648\u0639\u0629 \u0635\u0648\u0631 \u062a\u0627\u0631\u064a\u062e\u064a\u0629 \u0644\u0644\u0633\u0643\u0643 \u0627\u0644\u062d\u062f\u064a\u062f\u064a\u0629 \u0645\u0646 \u0623\u0648\u0627\u062e\u0631 \u0627\u0644\u0633\u0628\u0639\u064a\u0646\u064a\u0627\u062a. \u0633\u0646\u0631\u0641\u0639\u0647\u0627 \u0625\u0644\u0649 \u0623\u0631\u0634\u064a\u0641 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",
    },
    fr: {
      [normalizeText("Beach cleanup campaign starts this Saturday.")]:
        "La campagne de nettoyage de la plage commence ce samedi.",
      [normalizeText(
        "The beach cleanup campaign starts this Saturday at 8:00 AM. Bring gloves and water. Let's make our coastline shine.",
      )]:
        "La campagne de nettoyage de la plage commence ce samedi \u00e0 8h00. Apportez des gants et de l'eau. Faisons briller notre littoral.",
      [normalizeText(
        "We hosted a youth AI workshop this afternoon. The students asked for a weekly coding circle. Who can mentor?",
      )]:
        "Nous avons anim\u00e9 un atelier d'IA pour les jeunes cet apr\u00e8s-midi. Les \u00e9tudiants ont demand\u00e9 un cercle de codage hebdomadaire. Qui peut encadrer ?",
      [normalizeText(
        "Found a set of historical railway photos from the late 1970s. Uploading them to the memory archive this week.",
      )]:
        "Nous avons trouv\u00e9 un ensemble de photos historiques du chemin de fer de la fin des ann\u00e9es 1970. Nous les ajoutons aux archives de m\u00e9moire cette semaine.",
    },
  },
  fr: {
    en: {},
    ar: {},
  },
  ar: {
    en: {},
    fr: {},
  },
  wo: {
    en: {},
    fr: {},
    ar: {},
  },
  ff: {
    en: {},
    fr: {},
    ar: {},
  },
  snk: {
    en: {},
    fr: {},
    ar: {},
  },
};

// TODO: Replace this dictionary lookup with a real translation provider
// (OpenAI API, Supabase Edge Function, Google Translate, or DeepL).
export async function translateContent(
  input: TranslateContentInput,
): Promise<TranslateContentResult> {
  const {text, sourceLang, targetLang} = input;

  if (sourceLang === targetLang) {
    return {
      translatedText: text,
      sourceLang,
      targetLang,
    };
  }

  const normalized = normalizeText(text);
  const translatedText = translationDictionary[sourceLang]?.[targetLang]?.[normalized];

  if (!translatedText) {
    throw new Error("Translation unavailable");
  }

  return {
    translatedText,
    sourceLang,
    targetLang,
  };
}
