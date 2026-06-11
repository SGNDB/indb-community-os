import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
import {detectContentLanguage} from "@/lib/i18n/detectContentLanguage";
import type {ContentLanguage} from "@/types/database";
import crypto from "crypto";
import {NextRequest, NextResponse} from "next/server";

const MAX_LENGTH = 3000;

const GOOGLE_SUPPORTED_LANGS = new Set(["ar", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "gu", "he", "hi", "hr", "hu", "id", "it", "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tl", "tr", "uk", "ur", "vi", "zh"]);

function parseGoogleTranslate(data: unknown): string | null {
  try {
    const parts = data as unknown[][];
    const translated: string = (parts?.[0] ?? [])
      .map((part: unknown) => Array.isArray(part) ? String(part[0] ?? "") : "")
      .filter(Boolean)
      .join("");
    return translated || null;
  } catch {
    return null;
  }
}

async function callGoogleTranslate(text: string, targetLang: string): Promise<string | null> {
  if (!GOOGLE_SUPPORTED_LANGS.has(targetLang)) return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {"User-Agent": "Mozilla/5.0"},
    });
    if (!res.ok) return null;
    return parseGoogleTranslate(await res.json());
  } catch {
    return null;
  }
}

async function callMyMemoryTranslate(text: string, targetLang: string): Promise<string | null> {
  try {
    const langPair = `en|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res = await fetch(url, {
      headers: {"User-Agent": "Mozilla/5.0"},
    });
    if (!res.ok) return null;
    const data = await res.json();
    const translated: string = data?.responseData?.translatedText ?? "";
    return translated || null;
  } catch {
    return null;
  }
}

async function getCachedTranslation(
  contentType: string,
  contentId: string,
  targetLang: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {data} = await supabase
      .from("content_translations")
      .select("translated_text")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("target_lang", targetLang)
      .single();
    return data?.translated_text ?? null;
  } catch {
    return null;
  }
}

async function saveTranslation(
  contentType: string,
  contentId: string,
  sourceLang: ContentLanguage,
  targetLang: ContentLanguage,
  originalHash: string,
  translatedText: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const supabase = admin ?? await createClient();
    await supabase.from("content_translations").upsert(
      {
        content_type: contentType,
        content_id: contentId,
        source_lang: sourceLang,
        target_lang: targetLang,
        original_hash: originalHash,
        translated_text: translatedText,
      },
      {onConflict: "content_type,content_id,target_lang"},
    );
  } catch {
  }
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") || "Good morning";
  const targetLang = req.nextUrl.searchParams.get("target") || "ar";
  const contentType = req.nextUrl.searchParams.get("type") || "test";
  const contentId = req.nextUrl.searchParams.get("id") || "test-1";
  return handleTranslate(text, targetLang, contentType, contentId);
}

export async function POST(req: NextRequest) {
  try {
    const {contentType, contentId, text, targetLang} = await req.json();
    return handleTranslate(text, targetLang, contentType, contentId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({error: msg}, {status: 500});
  }
}

async function handleTranslate(text: string, targetLang: string, contentType: string, contentId: string) {
  try {

    if (!text || !targetLang || !contentType || !contentId) {
      return NextResponse.json({error: "Missing required fields"}, {status: 400});
    }

    if (typeof text !== "string" || text.length > MAX_LENGTH) {
      return NextResponse.json({error: "Text too long (max 3000 chars)"}, {status: 400});
    }

    const sourceLang = detectContentLanguage(text);

    if (sourceLang === targetLang) {
      return NextResponse.json({translatedText: text, sourceLang});
    }

    const cached = await getCachedTranslation(contentType, contentId, targetLang);
    if (cached) {
      return NextResponse.json({translatedText: cached, sourceLang});
    }

    const originalHash = crypto.createHash("sha256").update(text).digest("hex");

    let apiResult = await callGoogleTranslate(text, targetLang);
    if (!apiResult) {
      apiResult = await callMyMemoryTranslate(text, targetLang);
    }

    if (!apiResult) {
      return NextResponse.json({error: "All translation APIs returned no result"}, {status: 502});
    }

    await saveTranslation(contentType, contentId, sourceLang, targetLang as ContentLanguage, originalHash, apiResult);

    return NextResponse.json({translatedText: apiResult, sourceLang});
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({error: msg}, {status: 500});
  }
}
