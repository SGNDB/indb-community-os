'use server';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/lib/i18n/routing';
import { withLocale } from '@/lib/i18n/paths';
import { type ImageUploadKind, validateCompressedImageFile, validateImageFile } from '@/lib/images/upload-config';
import { getLocalizedAuthError } from '@/lib/auth/auth-error-messages';
import { recordAdminAuditLog } from '@/lib/security/admin-audit';
import { checkRateLimit, type RateLimitKind } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { assertFeatureEnabled } from '@/core/features/server';
import { publishPlatformEvent } from '@/core/events/platform-events';
import { adminCreditPointOptions, type AdminContentType } from '@/lib/data/admin';
import { toggleFollow } from '@/lib/data/follows';
import {
  createFollowNotification,
  createNotification,
  upsertReactionNotification,
  createCommentNotification,
} from '@/lib/data/notifications';
import { toggleReaction, getPostReactionDetails } from '@/lib/data/reactions';
import type { ConversationDetails, ConversationListItem, ConversationMessageWithSender } from '@/lib/data/conversations';
import {
  commentSchema,
  createPostSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from '@/lib/validations/community';
import { normalizeMauritaniaPhone, isValidMauritaniaPhone } from '@/lib/auth/phone';
import { getSyntheticPhoneLoginCredentials, getSyntheticPhoneRegistrationInput } from '@/lib/auth/phone-auth';
import { buildOnboardingProfileUpdate, getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import type {
  CommentWithAuthor,
  CommunityShareImage,
  ReactionType,
} from '@/types/database';
import {
  deletePostMedia,
  deleteMemoryMedia,
  deleteIdeaMedia,
  deletePostMediaByStoragePaths,
  insertPostMedia,
} from '@/lib/data/media';
import * as graatekActions from '@/modules/graatek/actions';
import * as memoryActions from '@/modules/memories/actions';
import * as campaignsActions from '@/modules/campaigns/actions';

export async function getMemoryReactionDetailsAction(memoryId: string, limit = 50, offset = 0) {
  return memoryActions.getMemoryReactionDetailsAction(memoryId, limit, offset);
}

export async function submitMemoryAction(formData: FormData) {
  return memoryActions.submitMemoryAction(formData);
}

export async function reactToMemoryAction(formData: FormData) {
  return memoryActions.reactToMemoryAction(formData);
}

export async function addMemoryCommentAction(formData: FormData) {
  return memoryActions.addMemoryCommentAction(formData);
}

export async function deleteMemoryCommentAction(formData: FormData) {
  return memoryActions.deleteMemoryCommentAction(formData);
}

export async function updateMemoryCommentAction(formData: FormData) {
  return memoryActions.updateMemoryCommentAction(formData);
}

export async function saveMemoryAction(formData: FormData) {
  return memoryActions.saveMemoryAction(formData);
}

export async function unsaveMemoryAction(formData: FormData) {
  return memoryActions.unsaveMemoryAction(formData);
}

export async function deleteMemoryAction(formData: FormData) {
  return memoryActions.deleteMemoryAction(formData);
}

export async function updateMemoryAction(formData: FormData) {
  return memoryActions.updateMemoryAction(formData);
}

export async function shareMemoryAction(formData: FormData) {
  return memoryActions.shareMemoryAction(formData);
}

export async function loadMoreTimelineMemoriesAction(params: {
  year: number;
  category?: string;
  sort?: string;
  page?: number;
}) {
  return memoryActions.loadMoreTimelineMemoriesAction(params);
}

function normalizeLocale(value: FormDataEntryValue | null) {
  const locale = typeof value === 'string' ? value : routing.defaultLocale;
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

function toPath(locale: string, pathname: string) {
  return withLocale(pathname, locale);
}

async function guardFeatureAction(featureId: Parameters<typeof assertFeatureEnabled>[0]) {
  try {
    await assertFeatureEnabled(featureId);
    return null;
  } catch {
    return 'module_disabled';
  }
}

function getReturnPath(formData: FormData, fallback: string) {
  const returnTo = formData.get('returnTo');
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/')) {
    return fallback;
  }

  if (returnTo.startsWith('//') || returnTo.includes('://')) {
    return fallback;
  }

  return returnTo;
}

function appendParam(path: string, key: string, value: string) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

async function isUserRateLimited(
  kind: RateLimitKind,
  userId: string,
) {
  const result = await checkRateLimit(kind, userId);
  return !result.allowed;
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headersList.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown-ip";
}

type AuthFieldErrors = {
  fullName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AdminSupabaseClient = NonNullable<ReturnType<typeof createAdminClient>>;
type ProfileClient = ServerSupabaseClient | AdminSupabaseClient;
type PhoneProfile = {
  id: string;
  phone: string | null;
  full_name: string | null;
  created_at: string | null;
};
type SupabaseErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
};

function getErrorMessage(error: SupabaseErrorLike | null | undefined) {
  return error?.message?.toLowerCase() ?? "";
}

function isAuthUserAlreadyRegisteredError(error: SupabaseErrorLike | null | undefined) {
  const message = getErrorMessage(error);
  const code = error?.code?.toLowerCase() ?? "";

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "email_address_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

function isWeakPasswordError(error: SupabaseErrorLike | null | undefined) {
  const message = getErrorMessage(error);
  return message.includes("weak password") || message.includes("at least 8");
}

function isRateLimitError(error: SupabaseErrorLike | null | undefined) {
  return getErrorMessage(error).includes("rate limit");
}

function isNetworkError(error: SupabaseErrorLike | null | undefined) {
  const message = getErrorMessage(error);
  return message.includes("network") || message.includes("fetch");
}

function isInvalidCredentialsError(error: SupabaseErrorLike | null | undefined) {
  const message = getErrorMessage(error);
  return (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("wrong password")
  );
}

async function findProfileByPhone(
  supabase: ServerSupabaseClient,
  normalizedPhone: string,
): Promise<{profile: PhoneProfile | null; error: SupabaseErrorLike | null; source: "admin" | "anon"}> {
  const adminClient = createAdminClient();
  const client: ProfileClient = adminClient ?? supabase;
  const source = adminClient ? "admin" : "anon";
  const {data, error} = await client
    .from('profiles')
    .select('id, phone, full_name, created_at')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  return {profile: data as PhoneProfile | null, error, source};
}

function authValidationErrors(
  issues: Array<{path: PropertyKey[]; message: string}>,
  values: Record<string, FormDataEntryValue | null>,
  errorT: (key: string) => string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  for (const issue of issues) {
    const field = String(issue.path[0] ?? "general") as keyof AuthFieldErrors;
    const rawValue = values[field];
    const isEmpty = typeof rawValue !== "string" || rawValue.trim().length === 0;

    if (field === "fullName") errors.fullName = errorT(isEmpty ? "full_name_required" : issue.message);
    else if (field === "phone") errors.phone = errorT(isEmpty ? "phone_required" : issue.message);
    else if (field === "password") errors.password = errorT(isEmpty ? "password_required" : issue.message);
    else if (field === "confirmPassword") errors.confirmPassword = errorT(isEmpty ? "confirm_password_required" : issue.message);
    else errors.general = errorT(issue.message || "auth_generic_error");
  }

  return errors;
}

export async function signOutAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect(toPath(locale, '/'));
}

async function preserveForcedLightTheme() {
  const cookieStore = await cookies();
  const hasQrEntry =
    cookieStore.get("qr_ref")?.value === "1" ||
    cookieStore.get("entry")?.value === "qr";
  const hasLightTheme = cookieStore.get("theme")?.value === "light";

  if (!hasQrEntry && !hasLightTheme) return;

  cookieStore.set("theme", "light", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  if (hasQrEntry) {
    cookieStore.set("entry", "qr", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    cookieStore.set("qr_ref", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
}

export async function loginAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const errorT = await getTranslations({ locale, namespace: 'Auth.errors' });

  const parsed = loginSchema.safeParse({
    phone: formData.get('phone'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      error: authValidationErrors(parsed.error.issues, {
        phone: formData.get('phone'),
        password: formData.get('password'),
      }, errorT),
    };
  }

  const rawPhone = parsed.data.phone.trim();
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeMauritaniaPhone(rawPhone);
  } catch (err) {
    console.error("LOGIN: Phone normalization failed", err);
    return { error: { phone: errorT("auth_invalid_phone") } };
  }

  console.log("LOGIN raw phone:", rawPhone);
  console.log("LOGIN normalized phone:", normalizedPhone);

  if (!isValidMauritaniaPhone(normalizedPhone)) {
    return { error: { phone: errorT("auth_invalid_phone") } };
  }

  console.log("LOGIN phone identifier:", normalizedPhone);

  const ip = await getClientIp();
  const rateCheck = await checkRateLimit("login", `${ip}:${normalizedPhone}`);

  if (!rateCheck.allowed) {
    return { error: { general: errorT("auth_rate_limited") } };
  }

  const supabase = await createClient();
  const loginCredentials = getSyntheticPhoneLoginCredentials(normalizedPhone, parsed.data.password);
  const { error } = await supabase.auth.signInWithPassword(loginCredentials);

  if (error) {
    console.error("LOGIN error:", { message: error.message, code: error.code, status: error.status });

    const mappedError = getLocalizedAuthError(error, errorT);
    if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("email not verified")) {
      return { error: { general: mappedError } };
    }

    if (isInvalidCredentialsError(error)) return { error: { password: errorT("auth_invalid_credentials") } };
    return { error: { general: mappedError } };
  }

  let profile: { onboarding_completed?: boolean } | null = null;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Check if profile is missing, if so, repair it
    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    profile = profileData;

    if (profileFetchError) {
      console.error("LOGIN ERROR: failed to fetch profile during repair check", profileFetchError);
    }

    if (!profile) {
      console.log("LOGIN: profile missing, repairing now...");
      const autoUsername = `u${user.id.replace(/-/g, '').slice(0, 12)}`;
      const profileData = {
        id: user.id,
        username: autoUsername,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || normalizedPhone,
        role: 'member',
      };

      try {
        const adminClient = createAdminClient();
        const writeClient = adminClient ?? supabase;
        const { error: repairError } = await writeClient.from('profiles').upsert(profileData, { onConflict: 'id' });
        if (repairError) {
          console.error("LOGIN ERROR: profile repair upsert failed", repairError);
        } else {
          console.log("LOGIN: profile repair upsert completed successfully");
          profile = { onboarding_completed: false };
        }
      } catch (e) {
        console.error("LOGIN ERROR: exception during profile repair", e);
      }
    }

  }

  await preserveForcedLightTheme();

  const onboardingCompleted = profile?.onboarding_completed ?? false;
  const redirectPath = getPostAuthRedirectPath(locale, onboardingCompleted);

  revalidatePath(toPath(locale, '/'));
  return { success: true, redirect: redirectPath };
}

export async function registerAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const errorT = await getTranslations({ locale, namespace: 'Auth.errors' });

  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      error: authValidationErrors(parsed.error.issues, {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
      }, errorT),
    };
  }

  const rawPhone = parsed.data.phone.trim();
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeMauritaniaPhone(rawPhone);
  } catch (err) {
    console.error("REGISTER: Phone normalization failed", err);
    return { error: { phone: errorT("auth_invalid_phone") } };
  }

  console.log("REGISTER raw phone:", rawPhone);
  console.log("REGISTER normalized phone:", normalizedPhone);

  if (!isValidMauritaniaPhone(normalizedPhone)) {
    return { error: { phone: errorT("auth_invalid_phone") } };
  }

  const password = parsed.data.password;
  const fullName = parsed.data.fullName;

  console.log("REGISTER phone identifier:", normalizedPhone);

  const ip = await getClientIp();
  const rateCheck = await checkRateLimit("register", ip);

  if (!rateCheck.allowed) {
    return { error: { general: errorT("auth_rate_limited") } };
  }

  const supabase = await createClient();
  const existingProfileLookup = await findProfileByPhone(supabase, normalizedPhone);
  const existingProfileByPhone = existingProfileLookup.profile;

  console.log("REGISTER existing profile:", existingProfileByPhone);

  if (existingProfileLookup.error) {
    console.error("REGISTER: phone uniqueness check failed", {
      source: existingProfileLookup.source,
      message: existingProfileLookup.error.message,
      code: existingProfileLookup.error.code,
      details: existingProfileLookup.error.details,
      hint: existingProfileLookup.error.hint,
    });
    return { error: { general: errorT("auth_generic_error") } };
  }

  if (existingProfileByPhone) {
    console.log("REGISTER: phone already registered", { normalizedPhone });
    return { error: { phone: "auth_phone_exists" } };
  }

  console.log("REGISTER START");
  console.log("REGISTER normalizedPhone", normalizedPhone);

  const adminClient = createAdminClient();
  if (!adminClient) {
    console.error("REGISTER: admin client unavailable for phone registration");
    return { error: { general: errorT("auth_generic_error") } };
  }

  const registrationInput = getSyntheticPhoneRegistrationInput({
    normalizedPhone,
    fullName,
    password,
  });

  console.log("REGISTER: using synthetic email credentials for phone registration");

  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser(registrationInput);
  console.log("REGISTER createUser result", { userId: createdUser?.user?.id, error: createUserError ? { message: createUserError.message, code: createUserError.code } : null });

  if (createUserError) {
    console.error("REGISTER ERROR: auth user creation failed", { message: createUserError.message, code: createUserError.code, status: createUserError.status });
    if (isAuthUserAlreadyRegisteredError(createUserError)) return { error: { phone: "auth_phone_exists" } };
    if (isWeakPasswordError(createUserError)) return { error: { password: errorT("auth_weak_password") } };
    if (isRateLimitError(createUserError)) return { error: { general: errorT("auth_rate_limited") } };
    if (isNetworkError(createUserError)) return { error: { general: errorT("auth_network_error") } };
    return { error: { general: getLocalizedAuthError(createUserError, errorT) } };
  }

  const userId = createdUser?.user?.id;
  if (!userId) {
    console.error("REGISTER ERROR: no user returned from createUser", { createdUser });
    return { error: { general: errorT("auth_generic_error") } };
  }

  console.log("REGISTER createdUser.id", userId);

  const autoUsername = `u${userId.replace(/-/g, '').slice(0, 12)}`;
  const profileData = {
    id: userId,
    username: autoUsername,
    full_name: fullName,
    phone: normalizedPhone,
    role: 'member',
  };

  let profileError: SupabaseErrorLike | null = null;

  try {
    const profileClient = adminClient ?? supabase;
    const { error } = await profileClient.from('profiles').upsert(profileData, { onConflict: 'id' });
    profileError = error;
  } catch (e) {
    console.error("REGISTER: profile upsert failed", e);
    profileError = { message: String(e), code: 'PROFILE_UPSERT_FAILED' } as SupabaseErrorLike;
  }

  console.log("REGISTER profile insert result", { profileData, error: profileError ? { message: profileError.message, code: profileError.code } : null });

  if (profileError) {
    console.error("REGISTER ERROR: profile creation failed", { message: profileError.message, code: profileError.code, details: profileError.details, hint: profileError.hint });
    const conflictLookup = await findProfileByPhone(supabase, normalizedPhone);
    if (conflictLookup.profile?.id === userId) {
      console.log("REGISTER: profile already exists for newly-created auth user, continuing to sign in");
    } else {
      return { error: { general: errorT("auth_generic_error") } };
    }
  }

  await supabase.rpc("ensure_user_settings", {target_user_id: userId});

  console.log("REGISTER: attempting immediate sign-in with synthetic email credentials");
  const signInCredentials = getSyntheticPhoneLoginCredentials(normalizedPhone, password);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(signInCredentials);
  console.log("REGISTER signIn result", { userId: signInData?.user?.id, session: !!signInData?.session, error: signInError ? { message: signInError.message, code: signInError.code } : null });

  if (signInError) {
    console.error("REGISTER signIn error", signInError);
    return {
      error: {
        general: getLocalizedAuthError(signInError, errorT),
      },
    };
  }

  if (!signInData?.session) {
    console.error("REGISTER: signIn succeeded without a session");
    return { error: { general: errorT("auth_generic_error") } };
  }

  console.log("REGISTER redirecting based on onboarding status");
  await preserveForcedLightTheme();
  const redirectPath = getPostAuthRedirectPath(locale, false);
  return { success: true, redirect: redirectPath };
}

export async function resendVerificationAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const errorT = await getTranslations({ locale, namespace: 'Auth.errors' });
  const successT = await getTranslations({ locale, namespace: 'Auth.success' });

  const email = formData.get('email');

  const emailConfirmation = formData.get('emailConfirmation');
  const emailConfirmationParam = emailConfirmation === '1' ? '&emailConfirmation=1' : '';

  if (typeof email !== 'string' || !email.includes('@')) {
    redirect(toPath(locale, `/login?error=${encodeURIComponent(errorT("auth_invalid_email"))}${emailConfirmationParam}`));
  }

  const ip = await getClientIp();
  const rateCheck = await checkRateLimit("resendVerification", ip);

  if (!rateCheck.allowed) {
    redirect(toPath(locale, `/login?error=${encodeURIComponent(errorT("auth_rate_limited"))}${emailConfirmationParam}`));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) {
    const errorMessage = getLocalizedAuthError(error, errorT);
    redirect(toPath(locale, `/login?error=${encodeURIComponent(errorMessage)}${emailConfirmationParam}`));
  }

  const successMessage = encodeURIComponent(successT("auth_email_confirmation_sent"));
  redirect(toPath(locale, `/login?success=${successMessage}${emailConfirmationParam}`));
}

export async function forgotPasswordAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const errorT = await getTranslations({ locale, namespace: 'Auth.errors' });

  const email = formData.get('email');

  if (typeof email !== 'string' || !email.includes('@')) {
    redirect(toPath(locale, `/forgot-password?error=${encodeURIComponent(errorT("auth_invalid_email"))}`));
  }

  const ip = await getClientIp();
  const rateCheck = await checkRateLimit("passwordReset", ip);

  if (!rateCheck.allowed) {
    redirect(
      toPath(
        locale,
        `/forgot-password?error=${encodeURIComponent(errorT("auth_rate_limited"))}`,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/${locale}/login`,
  });

  if (error) {
    const errorMessage = getLocalizedAuthError(error, errorT);
    redirect(toPath(locale, `/forgot-password?error=${encodeURIComponent(errorMessage)}`));
  }

  redirect(toPath(locale, '/forgot-password?emailSent=1'));
}

async function uploadFile(
  file: File,
  bucket: string,
  userId: string,
  pathPrefix?: string,
): Promise<{ url: string | null; storagePath: string | null }> {
  const supabase = await createClient();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const prefix = pathPrefix ?? 'memories';
  const filePath = `${userId}/${prefix}/${Date.now()}-${safeFileName}`;

  if (process.env.NODE_ENV === 'development') {
    console.log('[uploadFile] starting upload', {
      bucket,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
    });
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploadFile] upload failed', {
        error: uploadError.message,
        statusCode: uploadError.statusCode,
      });
    }
    return { url: null, storagePath: null };
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (process.env.NODE_ENV === 'development') {
    console.log('[uploadFile] upload success', { publicUrl: publicUrlData.publicUrl });
  }

  return { url: publicUrlData.publicUrl, storagePath: filePath };
}

async function uploadImageFile(
  file: File,
  bucket: string,
  userId: string,
  kind: ImageUploadKind,
  t: (key: 'invalidType' | 'tooLarge' | 'failed') => string,
): Promise<{ url?: string; error?: string }> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[uploadImageFile] validating file', { size: file.size, type: file.type, kind });
  }

  const validationError = validateCompressedImageFile(file, kind);
  if (validationError) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploadImageFile] validation failed', { validationError });
    }
    return { error: t(validationError) };
  }

  const result = await uploadFile(file, bucket, userId);
  if (!result.url) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[uploadImageFile] uploadFile returned null');
    }
    return { error: t('failed') };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[uploadImageFile] success', { url: result.url });
  }

  return { url: result.url };
}

export async function createPostAction(
  formData: FormData,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const errorsT = await getTranslations({ locale, namespace: 'Errors' });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: errorsT('submitFailed') };
  }

  const categoryIdRaw = formData.get('categoryId');
  const parsed = createPostSchema.safeParse({
    content: formData.get('content'),
    categoryId: categoryIdRaw || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: errorsT('invalidPost') };
  }

  // Read pre-uploaded media metadata (files already uploaded directly to Supabase via browser)
  const mediaDataStr = formData.get('mediaData');
  const uploadedMedia: Array<{
    url: string;
    storagePath: string;
    type: 'image' | 'video';
    mime_type?: string;
  }> = typeof mediaDataStr === 'string' && mediaDataStr ? JSON.parse(mediaDataStr) : [];

  // Keep backward compatible single image_url
  let image_url: string | null = null;
  const firstImage = uploadedMedia.find((m) => m.type === 'image');
  if (firstImage) {
    image_url = firstImage.url;
  }
  if (!image_url) {
    image_url = (formData.get('imageUrl') as string | null) || null;
  }

  const { data: newPost } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: parsed.data.content,
      type: (formData.get('type') as string) || 'community',
      category_id: parsed.data.categoryId || null,
      image_url,
    })
    .select('id')
    .single();

  if (!newPost) {
    return { success: false, error: errorsT('submitFailed') };
  }

  // Insert media records
  if (uploadedMedia.length > 0) {
    await insertPostMedia(
      uploadedMedia.map((m, i) => ({
        post_id: newPost.id,
        url: m.url,
        type: m.type,
        mime_type: m.mime_type ?? '',
        storage_path: m.storagePath,
        position: i,
      })),
    );
  }

  await publishPlatformEvent({
    name: 'feed.posted',
    actorId: user.id,
    entityType: 'post',
    entityId: newPost.id,
  });

  revalidatePath(toPath(locale, '/feed'));

  return { success: true, id: newPost.id };
}

export async function updatePostAction(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const errorsT = await getTranslations({ locale, namespace: 'Errors' });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: errorsT('submitFailed') };
  }

  const postId = formData.get('postId');
  if (typeof postId !== 'string') {
    return { success: false, error: errorsT('invalidPost') };
  }

  const { data: existing } = await supabase
    .from('posts')
    .select('author_id, image_url')
    .eq('id', postId)
    .single();

  if (!existing || existing.author_id !== user.id) {
    return { success: false, error: errorsT('submitFailed') };
  }

  const categoryIdRaw = formData.get('categoryId');
  const parsed = createPostSchema.safeParse({
    content: formData.get('content'),
    categoryId: categoryIdRaw || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: errorsT('invalidPost') };
  }

  // Handle removed media
  const removedMediaStr = formData.get('removedMedia');
  let removedStoragePaths: string[] = [];
  if (typeof removedMediaStr === 'string' && removedMediaStr) {
    try {
      removedStoragePaths = JSON.parse(removedMediaStr);
    } catch {}
  }
  if (removedStoragePaths.length > 0) {
    await deletePostMediaByStoragePaths(removedStoragePaths);
  }

  // Read pre-uploaded media metadata
  const mediaDataStr = formData.get('mediaData');
  const uploadedMedia: Array<{
    url: string;
    storagePath: string;
    type: 'image' | 'video';
    mime_type?: string;
  }> = typeof mediaDataStr === 'string' && mediaDataStr ? JSON.parse(mediaDataStr) : [];

  // Re-fetch existing media to find max position
  const { data: existingMedia } = await supabase
    .from('post_media')
    .select('position')
    .eq('post_id', postId)
    .order('position', { ascending: false })
    .limit(1);

  let nextPosition = (existingMedia?.[0]?.position ?? -1) + 1;
  if (uploadedMedia.length > 0) {
    await insertPostMedia(
      uploadedMedia.map((m) => ({
        post_id: postId,
        url: m.url,
        type: m.type,
        mime_type: m.mime_type ?? '',
        storage_path: m.storagePath,
        position: nextPosition++,
      })),
    );
  }

  // Update backward-compatible image_url
  const { data: allMedia } = await supabase
    .from('post_media')
    .select('url, type')
    .eq('post_id', postId)
    .order('position', { ascending: true });
  let image_url = existing.image_url;
  const firstImage = allMedia?.find((m) => m.type === 'image');
  if (firstImage) {
    image_url = firstImage.url;
  } else if (removedStoragePaths.length > 0 && !allMedia?.length) {
    image_url = null;
  }

  await supabase
    .from('posts')
    .update({
      content: parsed.data.content,
      type: (formData.get('type') as string) || 'community',
      category_id: parsed.data.categoryId || null,
      image_url,
    })
    .eq('id', postId);

  revalidatePath(toPath(locale, '/feed'));

  return { success: true };
}

export async function addCommentAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const returnPath = getReturnPath(formData, '/feed');
  const postId = formData.get('postId');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(returnPath);
    redirect(toPath(locale, `/login?next=${next}`));
  }

  if (await isUserRateLimited('comment', user.id)) {
    redirect(toPath(locale, appendParam(returnPath, 'error', 'rate_limited')));
  }

  const parsed = commentSchema.safeParse({
    content: formData.get('content'),
  });

  if (!parsed.success || typeof postId !== 'string') {
    redirect(toPath(locale, returnPath));
  }

  const { data: postForNotify, error: postError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (postError || !postForNotify) {
    redirect(toPath(locale, appendParam(returnPath, 'error', 'post_not_found')));
  }

  const { data: insertedComment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content: parsed.data.content,
    })
    .select('id')
    .single();

  if (insertError) {
    redirect(toPath(locale, appendParam(returnPath, 'error', 'comment_failed')));
  }

  if (postForNotify.author_id !== user.id) {
    await createCommentNotification(postForNotify.author_id, user.id, postId, insertedComment?.id);
  }

  await publishPlatformEvent({
    name: 'feed.commented',
    actorId: user.id,
    entityType: 'comment',
    entityId: insertedComment.id,
    metadata: { postId },
  });

  revalidatePath(toPath(locale, returnPath));
  redirect(toPath(locale, appendParam(returnPath, 'commentAdded', '1')));
}

export async function submitCommentAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; comment?: CommentWithAuthor }> {
  const postId = formData.get('postId');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };

  if (await isUserRateLimited('comment', user.id)) {
    return { success: false, error: 'rate_limited' };
  }

  const parsed = commentSchema.safeParse({ content: formData.get('content') });
  if (!parsed.success || typeof postId !== 'string') {
    return { success: false, error: 'invalid' };
  }

  const { data: postForNotify, error: postError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (postError || !postForNotify) {
    return { success: false, error: 'post_not_found' };
  }

  const { data: newComment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content: parsed.data.content,
    })
    .select('*, author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)')
    .single();

  if (insertError || !newComment) return { success: false, error: 'insert_failed' };

  if (postForNotify.author_id !== user.id) {
    await createCommentNotification(postForNotify.author_id, user.id, postId, newComment.id);
  }

  return { success: true, comment: newComment as unknown as CommentWithAuthor };
}

export async function toggleReactionAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const returnPath = getReturnPath(formData, '/feed');
  const postId = formData.get('postId');
  const reactionType = formData.get('reactionType') as string | null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(returnPath);
    redirect(toPath(locale, `/login?next=${next}`));
  }

  if (await isUserRateLimited('reaction', user.id)) {
    redirect(toPath(locale, appendParam(returnPath, 'error', 'rate_limited')));
  }

  if (typeof postId !== 'string' || !reactionType) {
    redirect(toPath(locale, returnPath));
  }

  const validTypes: readonly string[] = [
    'like',
    'love',
    'support',
    'celebrate',
    'insightful',
    'sad',
  ];
  if (!validTypes.includes(reactionType)) {
    redirect(toPath(locale, returnPath));
  }

  const { data: postForNotify } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const result = await toggleReaction(postId, user.id, reactionType as ReactionType);

  if (result.action !== 'deleted' && postForNotify && postForNotify.author_id !== user.id) {
    await upsertReactionNotification(postForNotify.author_id, user.id, postId);
  }
}

export async function getPostReactionDetailsAction(postId: string, limit = 50, offset = 0) {
  return getPostReactionDetails(postId, limit, offset);
}

export async function toggleSaveAction(formData: FormData) {
  const postId = formData.get('postId');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  if (typeof postId !== 'string') {
    throw new Error('Invalid post');
  }

  const { data: existing } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('saved_posts').delete().eq('id', existing.id);
  } else {
    await supabase.from('saved_posts').insert({
      post_id: postId,
      user_id: user.id,
    });
  }
}

export async function toggleFollowAction(
  formData: FormData,
): Promise<{ success: boolean; following?: boolean; error?: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const profileId = formData.get('profileId');
  const profileUsername = formData.get('profileUsername');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'notAuthenticated' };
  }

  if (await isUserRateLimited('follow', user.id)) {
    return { success: false, error: 'rate_limited' };
  }

  if (typeof profileId !== 'string' || profileId.length === 0) {
    return { success: false, error: 'invalidProfile' };
  }

  const result = await toggleFollow(user.id, profileId);
  if (!result.success) return result;

  if (result.following) {
    await createFollowNotification(user.id, profileId);
  }

  revalidatePath(toPath(locale, '/profile'));
  if (typeof profileUsername === 'string' && profileUsername.length > 0) {
    revalidatePath(toPath(locale, `/profile/${profileUsername}`));
  }

  return result;
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const imageT = await getTranslations({ locale, namespace: 'ImageUpload' });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: imageT('notAuthenticated') };

  if (await isUserRateLimited('upload', user.id)) {
    return { error: imageT('failed') };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: imageT('noFile') };

  const uploaded = await uploadImageFile(file, 'avatars', user.id, 'avatar', imageT);
  if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? imageT('failed') };

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: uploaded.url })
    .eq('id', user.id);
  if (dbError) return { error: dbError.message };

  revalidatePath(toPath(locale, '/profile'));
  revalidatePath(toPath(locale, '/feed'));

  return { url: uploaded.url };
}

export async function uploadCoverAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const imageT = await getTranslations({ locale, namespace: 'ImageUpload' });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: imageT('notAuthenticated') };

  if (await isUserRateLimited('upload', user.id)) {
    return { error: imageT('failed') };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: imageT('noFile') };

  const uploaded = await uploadImageFile(file, 'profile-covers', user.id, 'cover', imageT);
  if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? imageT('failed') };

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ cover_image_url: uploaded.url })
    .eq('id', user.id);
  if (dbError) return { error: dbError.message };

  revalidatePath(toPath(locale, '/profile'));

  return { url: uploaded.url };
}

export async function updateProfileAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const locale = normalizeLocale(formData.get('locale'));
  const errorsT = await getTranslations({ locale, namespace: 'Errors' });
  const imageT = await getTranslations({ locale, namespace: 'ImageUpload' });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: imageT('notAuthenticated') };

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    bio: formData.get('bio'),
    city: formData.get('city'),
    hometown: formData.get('hometown'),
    languagesSpoken: formData.get('languagesSpoken'),
    languagePreference: formData.get('languagePreference'),
    avatarUrl: formData.get('avatarUrl'),
    coverImageUrl: formData.get('coverImageUrl'),
  });

  if (!parsed.success) {
    return { success: false, error: errorsT('invalidProfile') };
  }

  let avatarUrl = parsed.data.avatarUrl || null;
  let coverImageUrl = parsed.data.coverImageUrl || null;

  const avatarFile = formData.get('avatarFile');
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (await isUserRateLimited('upload', user.id)) {
      return { success: false, error: imageT('failed') };
    }
    const uploaded = await uploadImageFile(avatarFile, 'avatars', user.id, 'avatar', imageT);
    if (uploaded.error) {
      return { success: false, error: uploaded.error };
    }
    avatarUrl = uploaded.url ?? avatarUrl;
  }

  const coverFile = formData.get('coverFile');
  if (coverFile instanceof File && coverFile.size > 0) {
    if (await isUserRateLimited('upload', user.id)) {
      return { success: false, error: imageT('failed') };
    }
    const uploaded = await uploadImageFile(coverFile, 'profile-covers', user.id, 'cover', imageT);
    if (uploaded.error) {
      return { success: false, error: uploaded.error };
    }
    coverImageUrl = uploaded.url ?? coverImageUrl;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: parsed.data.fullName,
    bio: parsed.data.bio || null,
    city: parsed.data.city || null,
    hometown: parsed.data.hometown || null,
    languages_spoken: parsed.data.languagesSpoken
      ? parsed.data.languagesSpoken
          .split(',')
          .map((language) => language.trim())
          .filter(Boolean)
      : [],
    language_preference: parsed.data.languagePreference || 'auto',
    avatar_url: avatarUrl,
    cover_image_url: coverImageUrl,
  });

  if (error) {
    return { success: false, error: errorsT('saveFailed') };
  }

  await publishPlatformEvent({
    name: 'settings.updated',
    actorId: user.id,
    entityType: 'profile',
    entityId: user.id,
  });

  return { success: true };
}

function getValidationError(
  result: { success: boolean; error?: unknown },
  t: (key: string) => string,
  fallback: string,
): string {
  if (result.success) return '';

  const zodError = result.error as
    | { issues?: Array<{ path: Array<string | number>; message: string; code: string }> }
    | undefined;
  const issue = zodError?.issues?.[0];
  if (!issue) return t(fallback);

  const field = issue.path[0];
  if (issue.code === 'too_small') {
    if (field === 'title') return t('titleRequired');
    if (field === 'description') return t('descriptionRequired');
  }

  return t(fallback);
}

export async function deletePostAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const returnPath = getReturnPath(formData, '/feed');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, `/login?next=${encodeURIComponent(returnPath)}`));
  }

  const postId = formData.get('postId');

  if (typeof postId !== 'string') {
    redirect(toPath(locale, returnPath));
  }

  const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();

  if (!post || post.author_id !== user.id) {
    redirect(toPath(locale, returnPath));
  }

  // Clean up media (storage files + DB records) before deleting the post
  await deletePostMedia(postId);
  await supabase.from('posts').delete().eq('id', postId);

  revalidatePath(toPath(locale, returnPath));
  redirect(toPath(locale, appendParam(returnPath, 'postDeleted', '1')));
}

export async function deleteCommentAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const returnPath = getReturnPath(formData, '/feed');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, `/login?next=${encodeURIComponent(returnPath)}`));
  }

  const commentId = formData.get('commentId');

  if (typeof commentId !== 'string') {
    redirect(toPath(locale, returnPath));
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    redirect(toPath(locale, returnPath));
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', comment.post_id)
    .single();

  if (comment.author_id !== user.id && post?.author_id !== user.id) {
    redirect(toPath(locale, returnPath));
  }

  await supabase.from('comments').delete().eq('id', commentId);

  revalidatePath(toPath(locale, returnPath));
  redirect(toPath(locale, appendParam(returnPath, 'commentDeleted', '1')));
}

export async function updatePostCommentAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; comment?: CommentWithAuthor }> {
  const commentId = formData.get('commentId');
  const parsed = commentSchema.safeParse({ content: formData.get('content') });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'unauthorized' };
  }

  if (typeof commentId !== 'string' || !parsed.success) {
    return { success: false, error: 'invalid' };
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.author_id !== user.id) {
    return { success: false, error: 'forbidden' };
  }

  const { data: updatedComment, error: updateError } = await supabase
    .from('comments')
    .update({ content: parsed.data.content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select('*, author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)')
    .single();

  if (updateError || !updatedComment) {
    return { success: false, error: 'update_failed' };
  }

  return { success: true, comment: updatedComment as unknown as CommentWithAuthor };
}

export async function deletePostCommentAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const commentId = formData.get('commentId');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'unauthorized' };
  }

  if (typeof commentId !== 'string') {
    return { success: false, error: 'invalid' };
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    return { success: false, error: 'not_found' };
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', comment.post_id)
    .single();

  if (comment.author_id !== user.id && post?.author_id !== user.id) {
    return { success: false, error: 'forbidden' };
  }

  const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);

  if (deleteError) {
    return { success: false, error: 'delete_failed' };
  }

  return { success: true };
}

export async function sharePostAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; sharesCount?: number }> {
  const postId = formData.get('postId');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'unauthorized' };
  }

  if (typeof postId !== 'string') {
    return { success: false, error: 'invalid' };
  }

  const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();

  if (!post) {
    return { success: false, error: 'not_found' };
  }

  const { data: sharesCount, error: shareCountError } = await supabase.rpc(
    'increment_share_count',
    {
      p_entity_type: 'post',
      p_entity_id: postId,
    },
  );

  if (shareCountError || typeof sharesCount !== 'number') {
    console.error('sharePostAction increment_share_count error:', shareCountError);
    return { success: false, error: 'share_count_failed' };
  }

  if (post.author_id && post.author_id !== user.id) {
    await createNotification({
      userId: post.author_id,
      actorId: user.id,
      type: 'share',
      entityType: 'post',
      entityId: postId,
      title: 'Shared your post',
    });
  }

  return { success: true, sharesCount };
}

async function getStrictAdminUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;

  return user.id;
}

function redirectAdmin(locale: string, status: string, path = '/admin'): never {
  redirect(toPath(locale, `${path}?status=${encodeURIComponent(status)}`));
}

function extractPublicStoragePath(url: string | null | undefined, bucket: string) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) return null;

  const pathWithQuery = url.slice(markerIndex + marker.length);
  const path = pathWithQuery.split('?')[0];

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

async function removeStoragePaths(
  adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
  bucket: string,
  paths: string[],
) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));

  for (let index = 0; index < uniquePaths.length; index += 100) {
    const chunk = uniquePaths.slice(index, index + 100);
    if (chunk.length > 0) {
      await adminClient.storage.from(bucket).remove(chunk);
    }
  }
}

async function deleteAdminUserEverywhere(targetUserId: string) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return { success: false as const, reason: 'config' };
  }

  const [
    { data: profile },
    { data: posts },
    { data: ideas },
    { data: memories },
    { data: shares },
  ] = await Promise.all([
    adminClient
      .from('profiles')
      .select('avatar_url, cover_image_url')
      .eq('id', targetUserId)
      .maybeSingle(),
    adminClient.from('posts').select('id').eq('author_id', targetUserId),
    adminClient.from('ideas').select('id').eq('author_id', targetUserId),
    adminClient.from('memories').select('id').eq('contributor_id', targetUserId),
    adminClient.from('community_shares').select('id, images').eq('owner_id', targetUserId),
  ]);

  const postIds = (posts ?? []).map((post) => post.id);
  const ideaIds = (ideas ?? []).map((idea) => idea.id);
  const memoryIds = (memories ?? []).map((memory) => memory.id);
  const shareIds = (shares ?? []).map((share) => share.id);
  const shareMediaPaths = (shares ?? []).flatMap((share) => {
    const images = Array.isArray(share.images) ? (share.images as CommunityShareImage[]) : [];
    return images.map((image) => image.storagePath).filter(Boolean);
  });

  const [postMedia, ideaMedia, memoryMedia] = await Promise.all([
    postIds.length > 0
      ? adminClient.from('post_media').select('storage_path').in('post_id', postIds)
      : Promise.resolve({ data: [] as Array<{ storage_path: string }> }),
    ideaIds.length > 0
      ? adminClient.from('idea_media').select('storage_path').in('idea_id', ideaIds)
      : Promise.resolve({ data: [] as Array<{ storage_path: string }> }),
    memoryIds.length > 0
      ? adminClient.from('memory_media').select('storage_path').in('memory_id', memoryIds)
      : Promise.resolve({ data: [] as Array<{ storage_path: string }> }),
  ]);

  await Promise.all([
    removeStoragePaths(
      adminClient,
      'avatars',
      [extractPublicStoragePath(profile?.avatar_url, 'avatars')].filter(Boolean) as string[],
    ),
    removeStoragePaths(
      adminClient,
      'profile-covers',
      [extractPublicStoragePath(profile?.cover_image_url, 'profile-covers')].filter(
        Boolean,
      ) as string[],
    ),
    removeStoragePaths(
      adminClient,
      'post-media',
      (postMedia.data ?? []).map((item) => item.storage_path),
    ),
    removeStoragePaths(
      adminClient,
      'idea-media',
      (ideaMedia.data ?? []).map((item) => item.storage_path),
    ),
    removeStoragePaths(
      adminClient,
      'memory-archive',
      (memoryMedia.data ?? []).map((item) => item.storage_path),
    ),
    removeStoragePaths(adminClient, 'fadla-media', shareMediaPaths),
  ]);

  await Promise.all([
    adminClient
      .from('notifications')
      .delete()
      .or(`user_id.eq.${targetUserId},actor_id.eq.${targetUserId}`),
    adminClient
      .from('community_credits')
      .update({ awarded_by: null })
      .eq('awarded_by', targetUserId),
    adminClient.from('comments').delete().eq('author_id', targetUserId),
    adminClient.from('idea_comments').delete().eq('author_id', targetUserId),
    adminClient.from('memory_comments').delete().eq('author_id', targetUserId),
    adminClient.from('community_share_requests').delete().eq('requester_id', targetUserId),
    postIds.length > 0 ? adminClient.from('posts').delete().in('id', postIds) : Promise.resolve(),
    ideaIds.length > 0 ? adminClient.from('ideas').delete().in('id', ideaIds) : Promise.resolve(),
    memoryIds.length > 0
      ? adminClient.from('memories').delete().in('id', memoryIds)
      : Promise.resolve(),
    shareIds.length > 0
      ? adminClient.from('community_shares').delete().in('id', shareIds)
      : Promise.resolve(),
    adminClient.from('events').delete().eq('creator_id', targetUserId),
    adminClient.from('projects').delete().eq('creator_id', targetUserId),
    adminClient.from('polls').delete().eq('creator_id', targetUserId),
  ]);

  const { error: profileDeleteError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', targetUserId);

  if (profileDeleteError) {
    return { success: false as const, reason: 'profile', error: profileDeleteError };
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(targetUserId);

  if (authError) {
    const message = authError.message.toLowerCase();
    if (message.includes('not found') || message.includes('no user')) {
      return { success: true as const };
    }

    return { success: false as const, reason: 'auth', error: authError };
  }

  return { success: true as const };
}

export async function updateAdminUserRoleAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const adminUserId = await getStrictAdminUserId();

  if (!adminUserId) {
    redirect(toPath(locale, '/'));
  }

  const targetUserId = formData.get('userId');
  const role = formData.get('role');

  if (typeof targetUserId !== 'string' || (role !== 'member' && role !== 'admin')) {
    redirectAdmin(locale, 'invalid', '/admin/users');
  }

  if (targetUserId === adminUserId && role !== 'admin') {
    redirectAdmin(locale, 'selfRoleBlocked', '/admin/users');
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', targetUserId);

  if (error) {
    redirectAdmin(locale, 'roleError', '/admin/users');
  }

  await recordAdminAuditLog({
    adminId: adminUserId,
    action: 'user_role_updated',
    targetType: 'profile',
    targetId: targetUserId,
    metadata: { role },
  });

  revalidatePath(toPath(locale, '/admin'));
  revalidatePath(toPath(locale, '/admin/users'));
  redirectAdmin(locale, 'roleUpdated', '/admin/users');
}

export async function deleteAdminUserAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const adminUserId = await getStrictAdminUserId();

  if (!adminUserId) {
    redirect(toPath(locale, '/'));
  }

  const targetUserId = formData.get('userId');

  if (typeof targetUserId !== 'string' || !targetUserId) {
    redirectAdmin(locale, 'invalid', '/admin/users');
  }

  if (targetUserId === adminUserId) {
    redirectAdmin(locale, 'selfDeleteBlocked', '/admin/users');
  }

  const result = await deleteAdminUserEverywhere(targetUserId);

  if (!result.success && result.reason === 'config') {
    redirectAdmin(locale, 'userDeleteConfigError', '/admin/users');
  }

  if (!result.success) {
    console.error('deleteAdminUserAction error:', result.error);
    redirectAdmin(locale, 'userDeleteError', '/admin/users');
  }

  await recordAdminAuditLog({
    adminId: adminUserId,
    action: 'user_deleted',
    targetType: 'profile',
    targetId: targetUserId,
  });

  revalidatePath(toPath(locale, '/admin'));
  revalidatePath(toPath(locale, '/admin/users'));
  redirectAdmin(locale, 'userDeleted', '/admin/users');
}

export async function awardCommunityCreditsAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const adminUserId = await getStrictAdminUserId();

  if (!adminUserId) {
    redirect(toPath(locale, '/'));
  }

  const userId = formData.get('userId');
  const pointsValue = formData.get('points');
  const reason = formData.get('reason');
  const note = formData.get('note');
  const points = typeof pointsValue === 'string' ? Number(pointsValue) : NaN;

  if (
    typeof userId !== 'string' ||
    typeof reason !== 'string' ||
    !reason.trim() ||
    !adminCreditPointOptions.includes(points as (typeof adminCreditPointOptions)[number])
  ) {
    redirectAdmin(locale, 'invalid', '/admin/credits');
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('award_community_credit', {
    target_user_id: userId,
    credit_points: points,
    credit_reason: reason,
    credit_note: typeof note === 'string' ? note : null,
  });

  if (error) {
    redirectAdmin(locale, 'creditError', '/admin/credits');
  }

  await recordAdminAuditLog({
    adminId: adminUserId,
    action: 'credits_awarded',
    targetType: 'profile',
    targetId: userId,
    metadata: { points, reason },
  });

  await createNotification({
    userId,
    actorId: adminUserId,
    type: 'credit',
    entityType: 'credit',
    entityId: userId,
    title: 'Community credits awarded',
    message: String(points),
  });

  await publishPlatformEvent({
    name: 'recognition.awarded',
    actorId: adminUserId,
    entityType: 'profile',
    entityId: userId,
    metadata: { points, reason },
  });

  revalidatePath(toPath(locale, '/admin'));
  revalidatePath(toPath(locale, '/admin/credits'));
  redirectAdmin(locale, 'creditsAwarded', '/admin/credits');
}

export async function deleteAdminContentAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const adminUserId = await getStrictAdminUserId();

  if (!adminUserId) {
    redirect(toPath(locale, '/'));
  }

  const contentId = formData.get('contentId');
  const contentType = formData.get('contentType');

  if (
    typeof contentId !== 'string' ||
    (contentType !== 'post' && contentType !== 'idea' && contentType !== 'memory')
  ) {
    redirectAdmin(locale, 'invalid', '/admin/content');
  }

  const supabase = await createClient();
  const type = contentType as AdminContentType;
  const id = contentId;

  if (type === 'post') {
    await deletePostMedia(id);
    await supabase.from('notifications').delete().eq('entity_type', 'post').eq('entity_id', id);
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) redirectAdmin(locale, 'deleteError', '/admin/content');
  }

  if (type === 'idea') {
    await deleteIdeaMedia(id);
    await supabase.from('notifications').delete().eq('entity_type', 'idea').eq('entity_id', id);
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) redirectAdmin(locale, 'deleteError', '/admin/content');
  }

  if (type === 'memory') {
    await deleteMemoryMedia(id);
    await supabase.from('notifications').delete().eq('entity_type', 'memory').eq('entity_id', id);
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (error) redirectAdmin(locale, 'deleteError', '/admin/content');
  }

  await recordAdminAuditLog({
    adminId: adminUserId,
    action: 'content_deleted',
    targetType: type,
    targetId: id,
  });

  revalidatePath(toPath(locale, '/admin'));
  revalidatePath(toPath(locale, '/admin/content'));
  redirectAdmin(locale, 'contentDeleted', '/admin/content');
}

export async function submitFadlaItemAction(formData: FormData) {
  return graatekActions.submitFadlaItemAction(formData);
}

export async function updateFadlaItemAction(formData: FormData) {
  return graatekActions.updateFadlaItemAction(formData);
}

export async function deleteFadlaItemAction(formData: FormData) {
  return graatekActions.deleteFadlaItemAction(formData);
}

export async function requestFadlaItemAction(formData: FormData) {
  return graatekActions.requestFadlaItemAction(formData);
}

export async function acceptFadlaRequestAction(formData: FormData) {
  return graatekActions.acceptFadlaRequestAction(formData);
}

export async function confirmFadlaReceivedAction(formData: FormData) {
  return graatekActions.confirmFadlaReceivedAction(formData);
}

export async function confirmFadlaHandedOverAction(formData: FormData) {
  return graatekActions.confirmFadlaHandedOverAction(formData);
}

export async function declineFadlaRequestAction(formData: FormData) {
  return graatekActions.declineFadlaRequestAction(formData);
}

export async function sendFadlaMessageAction(formData: FormData) {
  return graatekActions.sendFadlaMessageAction(formData);
}

export async function shareCommunityShareAction(formData: FormData) {
  return graatekActions.shareCommunityShareAction(formData);
}

export async function submitCommunityShareAction(formData: FormData) {
  return graatekActions.submitCommunityShareAction(formData);
}

export async function updateCommunityShareAction(formData: FormData) {
  return graatekActions.updateCommunityShareAction(formData);
}

export async function deleteCommunityShareAction(formData: FormData) {
  return graatekActions.deleteCommunityShareAction(formData);
}

export async function requestCommunityShareAction(formData: FormData) {
  return graatekActions.requestCommunityShareAction(formData);
}
export async function completeOnboardingAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateOnboardingProfileAction(
  profileData: {
    full_name?: string;
    bio?: string;
    city?: string;
    languages?: string[];
    avatar_url?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData = buildOnboardingProfileUpdate(profileData);

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ---- Ideas V2 Server Actions ----

// ── Messages (Inbox) ──────────────────────────────────────────

export async function getMyConversationsAction(): Promise<{
  success: boolean;
  conversations?: ConversationListItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { getUserConversations } = await import('@/lib/data/conversations');
  const conversations = await getUserConversations(user.id);
  return { success: true, conversations };
}

export async function createOrGetDirectConversationAction(
  targetUserId: string,
): Promise<{
  success: boolean;
  conversationId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  if (!targetUserId || targetUserId === user.id) return { success: false, error: 'invalid' };

  const { canMessageUser } = await import('@/lib/data/user-settings');
  const { haveMutualFollow } = await import('@/lib/data/follows');
  const allowed = await canMessageUser(targetUserId, user.id);
  if (!allowed) return { success: false, error: 'forbidden' };
  const mutuallyFollowing = await haveMutualFollow(user.id, targetUserId);
  if (!mutuallyFollowing) {
    return { success: false, error: 'direct_mutual_required' };
  }

  const { createOrGetDirectConversation } = await import('@/lib/data/conversations');
  const conversationId = await createOrGetDirectConversation(user.id, targetUserId);
  if (!conversationId) return { success: false, error: 'failed' };

  return { success: true, conversationId };
}

export async function getConversationMessagesAction(
  conversationId: string,
): Promise<{
  success: boolean;
  conversation?: ConversationDetails;
  messages?: ConversationMessageWithSender[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { getConversationById, getConversationMessages } = await import('@/lib/data/conversations');
  const conversation = await getConversationById(conversationId, user.id);
  if (!conversation) return { success: false, error: 'not_found' };
  const isParticipant = conversation.participants.some(p => p.user_id === user.id);
  if (!isParticipant) return { success: false, error: 'unauthorized' };
  const messages = await getConversationMessages(conversationId, 80, user.id);
  return { success: true, conversation, messages };
}

export async function getConversationDetailsAction(
  conversationId: string,
): Promise<{
  success: boolean;
  conversation?: ConversationDetails;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { getConversationById } = await import('@/lib/data/conversations');
  const conversation = await getConversationById(conversationId, user.id);
  if (!conversation) return { success: false, error: 'not_found' };
  const isParticipant = conversation.participants.some(p => p.user_id === user.id);
  if (!isParticipant) return { success: false, error: 'unauthorized' };
  return { success: true, conversation };
}

export async function sendConversationMessageAction(
  formData: FormData,
): Promise<{
  success: boolean;
  message?: { id: string; created_at: string };
  error?: string;
}> {
  const conversationId = formData.get('conversationId');
  const messageText = formData.get('message');
  const messageTypeRaw = formData.get('messageType');
  const imageUrlRaw = formData.get('imageUrl');
  const imageStoragePathRaw = formData.get('imageStoragePath');
  const imageUrlsRaw = formData.get('imageUrls');
  const imageStoragePathsRaw = formData.get('imageStoragePaths');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  if (typeof conversationId !== 'string') {
    return { success: false, error: 'invalid' };
  }
  const messageType = messageTypeRaw === 'image' ? 'image' : 'text';
  const trimmed = typeof messageText === 'string' ? messageText.trim() : '';
  const imageUrl = typeof imageUrlRaw === 'string' && imageUrlRaw ? imageUrlRaw : null;
  const imageStoragePath = typeof imageStoragePathRaw === 'string' && imageStoragePathRaw ? imageStoragePathRaw : null;
  let imageUrls: string[] = [];
  let imageStoragePaths: string[] = [];
  try {
    if (typeof imageUrlsRaw === 'string') {
      const parsed = JSON.parse(imageUrlsRaw) as unknown;
      imageUrls = Array.isArray(parsed)
        ? parsed.filter((url): url is string => typeof url === 'string' && url.length > 0).slice(0, 10)
        : [];
    }
    if (typeof imageStoragePathsRaw === 'string') {
      const parsed = JSON.parse(imageStoragePathsRaw) as unknown;
      imageStoragePaths = Array.isArray(parsed)
        ? parsed.filter((path): path is string => typeof path === 'string' && path.length > 0).slice(0, 10)
        : [];
    }
  } catch { /* ignore parse errors */ }
  if (!imageUrls.length && imageUrl) imageUrls = [imageUrl];
  if (!imageStoragePaths.length && imageStoragePath) imageStoragePaths = [imageStoragePath];
  const hasImage = imageUrls.length > 0;

  if (messageType === 'text' && (!trimmed || trimmed.length > 1000)) {
    return { success: false, error: 'invalid' };
  }
  if (messageType === 'image' && (!hasImage || trimmed.length > 500)) {
    return { success: false, error: 'invalid' };
  }

  const { allowed } = await checkRateLimit('comment' as RateLimitKind, user.id);
  if (!allowed) return { success: false, error: 'rate_limited' };
  const { sendConversationMessage, getConversationById } = await import('@/lib/data/conversations');
  const conv = await getConversationById(conversationId, user.id);
  if (!conv || conv.archived_at) return { success: false, error: 'archived' };
  const isParticipant = conv.participants.some(p => p.user_id === user.id);
  if (!isParticipant) return { success: false, error: 'unauthorized' };
  const isIdeaConversation = conv.type === 'idea' || conv.type === 'idea_project_room';
  if (isIdeaConversation && (conv.idea_status === 'completed' || conv.idea_status === 'archived')) {
    return { success: false, error: 'archived' };
  }
  if (conv.type === 'direct') {
    const otherUserId = conv.participants.find((p) => p.user_id !== user.id)?.user_id;
    const { haveMutualFollow } = await import('@/lib/data/follows');
    const mutuallyFollowing = otherUserId ? await haveMutualFollow(user.id, otherUserId) : false;
    if (!mutuallyFollowing) {
      return { success: false, error: 'direct_mutual_required' };
    }
  }

  const result = await sendConversationMessage(conversationId, user.id, {
    message: trimmed || null,
    messageType,
    imageUrl: imageUrls[0] ?? null,
    imageStoragePath: imageStoragePaths[0] ?? null,
    imageUrls,
    imageStoragePaths,
  });
  if (!result) return { success: false, error: 'insert_failed' };

  const directTargetId = conv.type === 'direct'
    ? conv.participants.find((p) => p.user_id !== user.id)?.user_id ?? conversationId
    : null;
  const entityType = conv.type === 'graatek' ? 'community_share' : conv.type === 'direct' ? 'profile' : 'idea';
  const entityId = conv.type === 'direct' ? directTargetId! : (conv.graatek_id ?? conv.idea_id ?? conversationId) as string;
  await Promise.all(
    conv.participants
      .filter((p) => p.user_id !== user.id)
      .map((p) =>
        createNotification({
          userId: p.user_id,
          actorId: user.id,
          type: isIdeaConversation ? 'idea_group_message' : 'conversation_message',
          entityType,
          entityId,
          title: isIdeaConversation ? 'New message in project room' : 'sent you a message',
          metadata: {
            conversationId,
            message: trimmed.slice(0, 100),
            hasImage,
          },
        }),
      ),
  );

  await publishPlatformEvent({
    name: 'message.sent',
    actorId: user.id,
    entityType,
    entityId,
    metadata: { conversationId, messageType },
  });

  return { success: true, message: { id: result.id, created_at: result.created_at } };
}

export async function markConversationReadAction(
  conversationId: string,
): Promise<{ success: boolean; readAt?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { markConversationRead } = await import('@/lib/data/conversations');
  const readAt = await markConversationRead(conversationId, user.id);
  return { success: true, readAt };
}

export async function clearConversationAction(
  conversationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { clearConversationForUser } = await import('@/lib/data/conversations');
  const ok = await clearConversationForUser(conversationId, user.id);
  if (!ok) return { success: false, error: 'update_failed' };
  revalidatePath('/messages');
  return { success: true };
}

export async function deleteConversationForMeAction(
  conversationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { deleteConversationForUser } = await import('@/lib/data/conversations');
  const ok = await deleteConversationForUser(conversationId, user.id);
  if (!ok) return { success: false, error: 'delete_failed' };
  revalidatePath('/messages');
  return { success: true };
}

export async function muteConversationAction(
  conversationId: string,
  option: '1h' | '8h' | '1w' | 'forever',
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { muteConversationForUser } = await import('@/lib/data/conversations');
  const ok = await muteConversationForUser(conversationId, user.id, option);
  if (!ok) return { success: false, error: 'update_failed' };
  return { success: true };
}

export async function blockConversationUserAction(
  conversationId: string,
): Promise<{ success: boolean; error?: string; blockedAt?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { blockDirectConversationUser, getDirectConversationBlockState } = await import('@/lib/data/conversations');
  const ok = await blockDirectConversationUser(conversationId, user.id);
  if (!ok) return { success: false, error: 'block_failed' };
  const blockState = await getDirectConversationBlockState(conversationId, user.id);
  return { success: true, blockedAt: blockState.blockedByMeAt ?? new Date().toISOString() };
}

export async function unblockConversationUserAction(
  conversationId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { unblockDirectConversationUser } = await import('@/lib/data/conversations');
  const ok = await unblockDirectConversationUser(conversationId, user.id);
  if (!ok) return { success: false, error: 'unblock_failed' };
  return { success: true };
}

export async function reportConversationUserAction(
  conversationId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { reportConversationUser } = await import('@/lib/data/conversations');
  const ok = await reportConversationUser(conversationId, user.id, reason);
  if (!ok) return { success: false, error: 'report_failed' };
  return { success: true };
}

export async function editConversationMessageAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const messageId = formData.get('messageId');
  const message = formData.get('message');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  if (typeof messageId !== 'string' || typeof message !== 'string') {
    return { success: false, error: 'invalid' };
  }

  const cleanMessage = message.trim();
  if (!cleanMessage || cleanMessage.length > 1000) {
    return { success: false, error: 'invalid' };
  }

  const { editConversationMessage } = await import('@/lib/data/conversations');
  const updated = await editConversationMessage(messageId, user.id, cleanMessage);
  if (!updated) return { success: false, error: 'update_failed' };
  return { success: true };
}

export async function deleteConversationMessageAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const messageId = formData.get('messageId');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  if (typeof messageId !== 'string') return { success: false, error: 'invalid' };

  const { deleteConversationMessage } = await import('@/lib/data/conversations');
  const updated = await deleteConversationMessage(messageId, user.id);
  if (!updated) return { success: false, error: 'delete_failed' };
  return { success: true };
}

export async function reportConversationMessageAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const messageId = formData.get('messageId');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  if (typeof messageId !== 'string') return { success: false, error: 'invalid' };

  const { reportConversationMessage } = await import('@/lib/data/conversations');
  const ok = await reportConversationMessage(messageId, user.id);
  if (!ok) return { success: false, error: 'report_failed' };
  return { success: true };
}

export async function searchConversationsAction(
  query: string,
): Promise<{
  success: boolean;
  conversations?: ConversationListItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'unauthorized' };
  const { searchUserConversations } = await import('@/lib/data/conversations');
  const conversations = await searchUserConversations(user.id, query);
  return { success: true, conversations };
}

export async function recordSupportContributionAction(formData: FormData) {
  return campaignsActions.recordSupportContributionAction(formData);
}

export async function adminSetSupportContributionStatusAction(formData: FormData) {
  return campaignsActions.adminSetSupportContributionStatusAction(formData);
}

export async function adminUpdateSupportCampaignAction(formData: FormData) {
  return campaignsActions.adminUpdateSupportCampaignAction(formData);
}

export async function adminCreateSupportCampaignAction(formData: FormData) {
  return campaignsActions.adminCreateSupportCampaignAction(formData);
}

export async function adminCreateSupportUpdateAction(formData: FormData) {
  return campaignsActions.adminCreateSupportUpdateAction(formData);
}

export async function createNotificationAction(formData: FormData) {
  const locale = normalizeLocale(formData.get('locale'));
  const title = formData.get('title');
  const message = formData.get('message');
  const target = formData.get('target');
  const language = formData.get('language');
  const link = formData.get('link');
  const scheduleTime = formData.get('scheduleTime');
  const notificationType = formData.get('notificationType');

  const { getCurrentAdminProfile } = await import('@/lib/data/admin');
  const adminProfile = await getCurrentAdminProfile();
  if (!adminProfile || typeof title !== 'string' || typeof message !== 'string') {
    redirect(withLocale('/', locale));
  }

  const admin = createAdminClient();
  const safeTitle = title.trim().slice(0, 100);
  const safeMessage = message.trim().slice(0, 500);
  const safeTarget = typeof target === 'string' ? target : 'all';
  const safeLanguage = typeof language === 'string' ? language : 'all';
  const safeType = typeof notificationType === 'string' ? notificationType.trim().slice(0, 80) : 'admin_announcement';
  const safeLink = typeof link === 'string' && link.trim().startsWith('/') && !link.trim().startsWith('//')
    ? link.trim().slice(0, 200)
    : null;
  const safeScheduleTime = typeof scheduleTime === 'string' && scheduleTime.trim() ? scheduleTime.trim().slice(0, 80) : null;

  if (admin && safeTitle && safeMessage) {
    const profileQuery = admin.from('profiles').select('id, language_preference').limit(750);
    const {data: profiles} = safeTarget === 'arabic' || safeLanguage === 'ar'
      ? await profileQuery.eq('language_preference', 'ar')
      : safeTarget === 'french' || safeLanguage === 'fr'
        ? await profileQuery.eq('language_preference', 'fr')
        : safeTarget === 'english' || safeLanguage === 'en'
          ? await profileQuery.eq('language_preference', 'en')
          : await profileQuery;

    let targetIds = new Set((profiles ?? []).map((profile) => profile.id as string).filter((id) => id !== adminProfile.id));

    if (['donors', 'volunteers'].includes(safeTarget)) {
      const contributionType = safeTarget === 'donors' ? 'money' : 'volunteer';
      const {data: contributions} = await admin
        .from('support_contributions')
        .select('contributor_id')
        .eq('contribution_type', contributionType)
        .not('contributor_id', 'is', null)
        .limit(750);
      targetIds = new Set((contributions ?? []).map((row) => row.contributor_id as string).filter((id) => id && id !== adminProfile.id));
    } else if (safeTarget === 'idea_participants') {
      const {data: participants} = await admin
        .from('idea_participants')
        .select('user_id')
        .limit(750);
      targetIds = new Set((participants ?? []).map((row) => row.user_id as string).filter((id) => id && id !== adminProfile.id));
    } else if (safeTarget === 'graatek_users') {
      const {data: shares} = await admin
        .from('community_shares')
        .select('owner_id')
        .limit(750);
      targetIds = new Set((shares ?? []).map((row) => row.owner_id as string).filter((id) => id && id !== adminProfile.id));
    }

    const entityId = crypto.randomUUID();
    const rows = Array.from(targetIds).slice(0, 500).map((userId) => ({
      user_id: userId,
      actor_id: adminProfile.id,
      type: safeType || 'admin_announcement',
      entity_type: 'announcement',
      entity_id: entityId,
      title: safeTitle,
      message: safeMessage,
      metadata: {
        target: safeTarget,
        language: safeLanguage,
        link: safeLink,
        scheduleTime: safeScheduleTime,
        source: 'admin_notifications',
      },
    }));

    if (rows.length > 0) {
      const {error} = await admin.from('notifications').insert(rows);
      if (error) console.error('createNotificationAction broadcast error:', error);
    }
  } else if (safeTitle && safeMessage) {
    await createNotification({
      userId: adminProfile.id,
      actorId: adminProfile.id,
      type: 'admin_announcement',
      entityType: 'announcement',
      entityId: crypto.randomUUID(),
      title: safeTitle,
      message: safeMessage,
    });
  }

  revalidatePath('/admin/notifications');
  redirect(withLocale('/admin/notifications?status=sent', locale));
}

export async function adminSetDonationStatusAction(formData: FormData) {
  return campaignsActions.adminSetDonationStatusAction(formData);
}
