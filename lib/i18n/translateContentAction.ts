"use server";

import {createClient} from "@/lib/supabase/server";
import {detectContentLanguage} from "@/lib/i18n/detectContentLanguage";
import type {ContentLanguage} from "@/types/database";
import crypto from "crypto";

const MAX_LENGTH = 3000;

async function getCachedTranslation(
  contentType: string,
  contentId: string,
  targetLang: string,
): Promise<string | null> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("content_translations")
    .select("translated_text")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("target_lang", targetLang)
    .single();
  return data?.translated_text ?? null;
}

async function saveTranslation(
  contentType: string,
  contentId: string,
  sourceLang: ContentLanguage,
  targetLang: ContentLanguage,
  originalHash: string,
  translatedText: string,
): Promise<void> {
  const supabase = await createClient();
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
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function callTranslationApi(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string | null> {
  try {
    const {default: translate} = await import("translate");
    const result = await translate(text, {
      from: sourceLang,
      to: targetLang,
      engine: "google",
    });
    return typeof result === "string" ? result : null;
  } catch {
    return null;
  }
}

export interface TranslateResult {
  translatedText: string;
  sourceLang: ContentLanguage;
}

export async function translateContentAction(
  contentType: string,
  contentId: string,
  text: string,
  targetLang: string,
): Promise<TranslateResult> {
  if (text.length > MAX_LENGTH) {
    throw new Error("Content too long to translate");
  }

  const detected = detectContentLanguage(text);
  const sourceLang = detected;

  if (sourceLang === targetLang) {
    return {translatedText: text, sourceLang};
  }

  const cached = await getCachedTranslation(contentType, contentId, targetLang);
  if (cached) {
    return {translatedText: cached, sourceLang};
  }

  const originalHash = hashText(text);
  const apiResult = await callTranslationApi(
    text,
    sourceLang,
    targetLang,
  );

  if (!apiResult) {
    throw new Error("Translation unavailable");
  }

  await saveTranslation(
    contentType,
    contentId,
    sourceLang,
    targetLang as ContentLanguage,
    originalHash,
    apiResult,
  );

  return {translatedText: apiResult, sourceLang};
}
