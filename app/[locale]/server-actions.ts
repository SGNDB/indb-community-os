"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {routing} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/server";
import {
  commentSchema,
  createPostSchema,
  ideaSchema,
  loginSchema,
  memorySchema,
  profileSchema,
  registerSchema,
} from "@/lib/validations/community";

function normalizeLocale(value: FormDataEntryValue | null) {
  const locale = typeof value === "string" ? value : routing.defaultLocale;
  return routing.locales.includes(locale as "ar" | "fr" | "en")
    ? locale
    : routing.defaultLocale;
}

function toPath(locale: string, pathname: string) {
  return `/${locale}${pathname}`;
}

export async function signOutAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(toPath(locale, "/"));
}

export async function loginAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? t("invalidInput"))}`,
      ),
    );
  }

  const supabase = await createClient();
  const {error} = await supabase.auth.signInWithPassword({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
  });

  if (error) {
    redirect(toPath(locale, `/login?error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/", "layout");
  redirect(toPath(locale, "/feed"));
}

export async function registerAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? t("invalidInput"))}`,
      ),
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const username = parsed.data.username;

  if (process.env.NODE_ENV === "development") {
    console.log("[register] signUp email:", email);
  }

  const supabase = await createClient();
  const {data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: username,
        username,
      },
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[register] signUp response:", {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message ?? null,
    });
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[register] signUp error:", error.message);
    }
    redirect(toPath(locale, `/register?error=${encodeURIComponent(error.message)}`));
  }

  if (data.user?.id) {
    try {
      const {error: upsertError} = await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        full_name: username,
        role: "member",
      });

      if (upsertError) {
        if (process.env.NODE_ENV === "development") {
          console.log("[register] profile upsert error:", upsertError.message);
        }
        redirect(toPath(locale, `/register?error=${encodeURIComponent(upsertError.message)}`));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Profile creation failed";
      if (process.env.NODE_ENV === "development") {
        console.log("[register] profile upsert exception:", msg);
      }
      redirect(toPath(locale, `/register?error=${encodeURIComponent(msg)}`));
    }
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(toPath(locale, "/feed"));
  }

  redirect(toPath(locale, "/login?emailConfirmation=1"));
}

export async function createPostAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const parsed = createPostSchema.safeParse({
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/feed?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? t("invalidPost"))}`,
      ),
    );
  }

  await supabase.from("posts").insert({
    author_id: user.id,
    content: parsed.data.content,
    type: (formData.get("type") as string) || "community",
    category_id: parsed.data.categoryId || null,
    image_url: (formData.get("imageUrl") as string | null) || null,
  });

  revalidatePath(toPath(locale, "/feed"));
  redirect(toPath(locale, "/feed"));
}

export async function addCommentAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const postId = formData.get("postId");
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const parsed = commentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success || typeof postId !== "string") {
    redirect(toPath(locale, "/feed"));
  }

  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: parsed.data.content,
  });

  revalidatePath(toPath(locale, "/feed"));
  redirect(toPath(locale, "/feed"));
}

export async function toggleLikeAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const postId = formData.get("postId");
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  if (typeof postId !== "string") {
    redirect(toPath(locale, "/feed"));
  }

  const {data: existing} = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  revalidatePath(toPath(locale, "/feed"));
  redirect(toPath(locale, "/feed"));
}

export async function updateProfileAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    bio: formData.get("bio"),
    city: formData.get("city"),
    languagePreference: formData.get("languagePreference"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/profile?error=${encodeURIComponent(
          parsed.error.issues[0]?.message ?? t("invalidProfile"),
        )}`,
      ),
    );
  }

  const {error} = await supabase.from("profiles").upsert({
    id: user.id,
    username: parsed.data.username,
    full_name: parsed.data.fullName,
    bio: parsed.data.bio || null,
    city: parsed.data.city || null,
    language_preference: parsed.data.languagePreference || "auto",
    avatar_url: parsed.data.avatarUrl || null,
  });

  if (error) {
    redirect(toPath(locale, `/profile?error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath(toPath(locale, "/profile"));
  redirect(toPath(locale, "/profile?updated=1"));
}

export async function submitMemoryAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const parsed = memorySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    decade: formData.get("decade"),
    year: formData.get("year"),
    location: formData.get("location"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/memory/submit?error=${encodeURIComponent(
          parsed.error.issues[0]?.message ?? t("invalidMemory"),
        )}`,
      ),
    );
  }

  const {data: memory, error} = await supabase
    .from("memories")
    .insert({
      contributor_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      decade: parsed.data.decade || null,
      year: parsed.data.year ? Number(parsed.data.year) : null,
      location: parsed.data.location || null,
      verification_status: "approved",
      tags: parsed.data.tags ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    })
    .select("id")
    .single();

  if (error || !memory) {
    redirect(
      toPath(locale, `/memory/submit?error=${encodeURIComponent(error?.message ?? t("saveFailed"))}`),
    );
  }

  const media = formData.get("media");

  if (media instanceof File && media.size > 0) {
    const sanitizedName = media.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `${user.id}/${Date.now()}-${sanitizedName}`;

    const upload = await supabase.storage.from("memory-archive").upload(filePath, media, {
      cacheControl: "3600",
      upsert: false,
    });

    if (!upload.error) {
      await supabase.from("memory_media").insert({
        memory_id: memory.id,
        uploader_id: user.id,
        bucket: "memory-archive",
        file_path: filePath,
        media_type: media.type || "image",
      });
    }
  }

  revalidatePath(toPath(locale, "/memory"));
  redirect(toPath(locale, "/memory"));
}

export async function submitIdeaAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const parsed = ideaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    redirect(
      toPath(
        locale,
        `/ideas/submit?error=${encodeURIComponent(
          parsed.error.issues[0]?.message ?? t("invalidIdea"),
        )}`,
      ),
    );
  }

  const {error} = await supabase.from("ideas").insert({
    author_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.categoryId,
  });

  if (error) {
    redirect(toPath(locale, `/ideas/submit?error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath(toPath(locale, "/ideas"));
  redirect(toPath(locale, "/ideas"));
}

export async function deletePostAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const postId = formData.get("postId");

  if (typeof postId !== "string") {
    redirect(toPath(locale, "/feed"));
  }

  const {data: post} = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post || post.author_id !== user.id) {
    redirect(toPath(locale, "/feed"));
  }

  await supabase.from("posts").delete().eq("id", postId);

  revalidatePath(toPath(locale, "/feed"));
  redirect(toPath(locale, "/feed"));
}

export async function deleteCommentAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  const commentId = formData.get("commentId");

  if (typeof commentId !== "string") {
    redirect(toPath(locale, "/feed"));
  }

  const {data: comment} = await supabase
    .from("comments")
    .select("author_id, post_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.author_id !== user.id) {
    redirect(toPath(locale, "/feed"));
  }

  await supabase.from("comments").delete().eq("id", commentId);

  revalidatePath(toPath(locale, "/feed"));
  redirect(toPath(locale, "/feed"));
}

export async function forgotPasswordAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const t = await getTranslations({locale, namespace: "Errors"});
  const supabase = await createClient();

  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    redirect(toPath(locale, `/forgot-password?error=${encodeURIComponent(t("invalidInput"))}`));
  }

  const {error} = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${locale}/login`,
  });

  if (error) {
    redirect(toPath(locale, `/forgot-password?error=${encodeURIComponent(error.message)}`));
  }

  redirect(toPath(locale, "/forgot-password?sent=1"));
}

export async function voteIdeaAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const ideaId = formData.get("ideaId");
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(toPath(locale, "/login"));
  }

  if (typeof ideaId !== "string") {
    redirect(toPath(locale, "/ideas"));
  }

  const {data: existing} = await supabase
    .from("idea_votes")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("idea_votes").delete().eq("id", existing.id);
  } else {
    await supabase.from("idea_votes").insert({
      idea_id: ideaId,
      user_id: user.id,
    });
  }

  revalidatePath(toPath(locale, "/ideas"));
  redirect(toPath(locale, "/ideas"));
}
