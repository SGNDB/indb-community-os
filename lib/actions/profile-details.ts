"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

function toPath(locale: string, path: string) {
  return `/${locale}${path}`;
}

// ---- Work ----

export async function addWorkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const {data: profile} = await supabase.from("profiles").select("id").eq("id", user.id).single();
  if (!profile) return {error: "Profile not found"};

  const company = formData.get("company") as string;
  const position = formData.get("position") as string;
  const startYear = parseInt(formData.get("startYear") as string);
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string) : null;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!company || !position || isNaN(startYear)) {
    return {error: "Missing required fields"};
  }

  const {error} = await supabase.from("profile_work").insert({
    profile_id: user.id,
    company,
    position,
    start_year: startYear,
    end_year: endYear,
    is_current: isCurrent,
  });

  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function updateWorkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  const company = formData.get("company") as string;
  const position = formData.get("position") as string;
  const startYear = parseInt(formData.get("startYear") as string);
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string) : null;
  const isCurrent = formData.get("isCurrent") === "true";

  if (!id || !company || !position || isNaN(startYear)) {
    return {error: "Missing required fields"};
  }

  const {error} = await supabase
    .from("profile_work")
    .update({company, position, start_year: startYear, end_year: endYear, is_current: isCurrent})
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function deleteWorkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  if (!id) return {error: "Missing id"};

  const {error} = await supabase.from("profile_work").delete().eq("id", id).eq("profile_id", user.id);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Education ----

export async function addEducationAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const school = formData.get("school") as string;
  const degree = formData.get("degree") as string;
  const fieldOfStudy = formData.get("fieldOfStudy") as string;
  const startYear = parseInt(formData.get("startYear") as string);
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string) : null;

  if (!school || isNaN(startYear)) {
    return {error: "Missing required fields"};
  }

  const {error} = await supabase.from("profile_education").insert({
    profile_id: user.id,
    school,
    degree: degree || null,
    field_of_study: fieldOfStudy || null,
    start_year: startYear,
    end_year: endYear,
  });

  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function updateEducationAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  const school = formData.get("school") as string;
  const degree = formData.get("degree") as string;
  const fieldOfStudy = formData.get("fieldOfStudy") as string;
  const startYear = parseInt(formData.get("startYear") as string);
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string) : null;

  if (!id || !school || isNaN(startYear)) {
    return {error: "Missing required fields"};
  }

  const {error} = await supabase
    .from("profile_education")
    .update({school, degree: degree || null, field_of_study: fieldOfStudy || null, start_year: startYear, end_year: endYear})
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function deleteEducationAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  if (!id) return {error: "Missing id"};

  const {error} = await supabase.from("profile_education").delete().eq("id", id).eq("profile_id", user.id);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Interests ----

export async function addInterestAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const name = (formData.get("name") as string)?.trim();
  if (!name) return {error: "Missing name"};

  const {error} = await supabase.from("profile_interests").insert({profile_id: user.id, name});
  if (error && error.code === "23505") return {success: true};
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function removeInterestAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const name = formData.get("name") as string;
  if (!name) return {error: "Missing name"};

  const {error} = await supabase.from("profile_interests").delete().eq("profile_id", user.id).eq("name", name);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Hobbies ----

export async function addHobbyAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const name = (formData.get("name") as string)?.trim();
  if (!name) return {error: "Missing name"};

  const {error} = await supabase.from("profile_hobbies").insert({profile_id: user.id, name});
  if (error && error.code === "23505") return {success: true};
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function removeHobbyAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const name = formData.get("name") as string;
  if (!name) return {error: "Missing name"};

  const {error} = await supabase.from("profile_hobbies").delete().eq("profile_id", user.id).eq("name", name);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Links ----

export async function addLinkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const platform = formData.get("platform") as string;
  const value = formData.get("value") as string;
  const visibility = formData.get("visibility") as string || "only_me";

  if (!platform || !value) return {error: "Missing required fields"};

  const {error} = await supabase.from("profile_links").insert({
    profile_id: user.id,
    platform,
    value,
    visibility,
  });

  if (error && error.code === "23505") return {success: true};
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function updateLinkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  const value = formData.get("value") as string;
  const visibility = formData.get("visibility") as string || "only_me";

  if (!id || !value) return {error: "Missing required fields"};

  const {error} = await supabase
    .from("profile_links")
    .update({value, visibility})
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function deleteLinkAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const id = formData.get("id") as string;
  if (!id) return {error: "Missing id"};

  const {error} = await supabase.from("profile_links").delete().eq("id", id).eq("profile_id", user.id);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Travel ----

export async function addTravelAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const country = (formData.get("country") as string)?.trim();
  if (!country) return {error: "Missing country"};

  const {error} = await supabase.from("profile_travel").insert({profile_id: user.id, country});
  if (error && error.code === "23505") return {success: true};
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

export async function removeTravelAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const country = formData.get("country") as string;
  if (!country) return {error: "Missing country"};

  const {error} = await supabase.from("profile_travel").delete().eq("profile_id", user.id).eq("country", country);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}

// ---- Profile fields ----

export async function updateProfileFieldsAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return {error: "Not authenticated"};

  const fields: Record<string, unknown> = {};

  const hometown = formData.get("hometown") as string;
  if (hometown !== null) fields.hometown = hometown || null;

  const languagesSpoken = formData.get("languagesSpoken") as string;
  if (languagesSpoken !== null) {
    fields.languages_spoken = languagesSpoken ? languagesSpoken.split(",").map((l) => l.trim()).filter(Boolean) : [];
  }

  if (Object.keys(fields).length === 0) return {success: true};

  const {error} = await supabase.from("profiles").update(fields).eq("id", user.id);
  if (error) return {error: error.message};

  revalidatePath(toPath(locale, "/profile"));
  return {success: true};
}
