"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

async function audit(adminName: string | null, key: string, oldVal: string | null, newVal: string | null) {
  try {
    const supabase = await createClient();
    await supabase.from("settings_audit_log").insert({
      admin_name: adminName, setting_key: key,
      old_value: oldVal, new_value: newVal,
    });
  } catch {}
}

export async function savePlatformSettings(settings: Record<string, unknown>) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) throw new Error("Forbidden");

  const oldRaw = await supabase.from("platform_settings").select("value").eq("key", "platform_settings").maybeSingle();
  const oldVal = (oldRaw.data as {value: string} | null)?.value ?? null;
  const newVal = JSON.stringify(settings);
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("platform_settings").upsert({key: "platform_settings", value: newVal}, {onConflict: "key"});
  if (error) throw new Error(error.message);
  await audit(adminName, "platform_settings", oldVal, newVal);
  revalidatePath("/admin/settings");
}

export async function saveFeatureFlags(flags: Record<string, boolean>) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) throw new Error("Forbidden");

  const oldRaw = await supabase.from("platform_settings").select("value").eq("key", "feature_flags").maybeSingle();
  const oldVal = (oldRaw.data as {value: string} | null)?.value ?? null;
  const newVal = JSON.stringify(flags);
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("platform_settings").upsert({key: "feature_flags", value: newVal}, {onConflict: "key"});
  if (error) throw new Error(error.message);
  await audit(adminName, "feature_flags", oldVal, newVal);
  revalidatePath("/admin/settings");
}

export async function saveLanguages(languages: Record<string, {enabled: boolean}>) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) throw new Error("Forbidden");

  const langs = Object.entries(languages).map(([code, val]) => ({
    code, name: code === "ar" ? "Arabic" : code === "fr" ? "French" : "English",
    enabled: val.enabled, isDefault: code === "ar",
  }));
  const oldRaw = await supabase.from("platform_settings").select("value").eq("key", "languages").maybeSingle();
  const oldVal = (oldRaw.data as {value: string} | null)?.value ?? null;
  const newVal = JSON.stringify(langs);
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("platform_settings").upsert({key: "languages", value: newVal}, {onConflict: "key"});
  if (error) throw new Error(error.message);
  await audit(adminName, "languages", oldVal, newVal);
  revalidatePath("/admin/settings");
}

export async function savePaymentMethods(methods: Record<string, Record<string, unknown>>) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) throw new Error("Forbidden");

  const arr = Object.entries(methods).map(([method, cfg]) => ({
    method, enabled: cfg.enabled as boolean,
    receiverName: cfg.receiverName as string,
    receiverAccount: cfg.receiverAccount as string,
    instructions: cfg.instructions as string,
    verificationRequired: cfg.verificationRequired as boolean,
  }));
  const oldRaw = await supabase.from("platform_settings").select("value").eq("key", "payment_methods").maybeSingle();
  const oldVal = (oldRaw.data as {value: string} | null)?.value ?? null;
  const newVal = JSON.stringify(arr);
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("platform_settings").upsert({key: "payment_methods", value: newVal}, {onConflict: "key"});
  if (error) throw new Error(error.message);
  await audit(adminName, "payment_methods", oldVal, newVal);
  revalidatePath("/admin/settings");
}

export async function changeAdminRole(userId: string, newRole: string) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  if (userId === user.id) throw new Error("Cannot change own role");

  const {data: target} = await supabase.from("profiles").select("full_name, username, role").eq("id", userId).maybeSingle();
  if (!target) throw new Error("User not found");
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("profiles").update({role: newRole as never}).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(adminName, `admin_role:${userId}`, target.role, newRole);
  revalidatePath("/admin/settings");
}

export async function removeAdminAccess(userId: string) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {data: profile} = await supabase.from("profiles").select("full_name, username, role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  if (userId === user.id) throw new Error("Cannot remove yourself");

  const {data: target} = await supabase.from("profiles").select("full_name, username, role").eq("id", userId).maybeSingle();
  if (!target) throw new Error("User not found");
  const adminName = profile.full_name ?? profile.username ?? "Unknown";

  const {error} = await supabase.from("profiles").update({role: "member" as never}).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(adminName, `admin_remove:${userId}`, target.role, "member");
  revalidatePath("/admin/settings");
}

export async function createCategory(data: {name_en: string; name_ar: string; name_fr: string; slug: string; icon?: string; color?: string}) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const {error} = await supabase.from("categories").insert({
    name_en: data.name_en, name_ar: data.name_ar, name_fr: data.name_fr,
    slug: data.slug, icon: data.icon ?? null, color: data.color ?? null,
    name_ff: "", name_snk: "", name_wo: "",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function updateCategory(id: number, data: {name_en?: string; name_ar?: string; name_fr?: string; slug?: string; icon?: string; color?: string}) {
  const supabase = await createClient();
  const {error} = await supabase.from("categories").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function archiveCategory(id: number) {
  const supabase = await createClient();
  const {error} = await supabase.from("categories").update({color: "#9ca3af" as string | null}).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function saveNotificationTemplates(templates: Record<string, {ar: string; fr: string; en: string}>) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const adminName = "Admin";

  const arr = Object.entries(templates).map(([key, vals]) => ({key, ...vals}));
  const newVal = JSON.stringify(arr);
  const {error} = await supabase.from("platform_settings").upsert({key: "notification_templates", value: newVal}, {onConflict: "key"});
  if (error) throw new Error(error.message);
  await audit(adminName, "notification_templates", null, newVal);
  revalidatePath("/admin/settings");
}
