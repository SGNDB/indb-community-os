#!/usr/bin/env node

import {createClient} from "@supabase/supabase-js";

const PHONE_DOMAIN = "phone.indb.local";
const ADMIN_ROLES = ["admin", "moderator"];

const BLOCKING_REFERENCES = [
  {table: "post_likes", column: "user_id", reason: "post reactions would be deleted"},
  {table: "saved_posts", column: "user_id", reason: "saved posts would be deleted"},
  {table: "idea_votes", column: "user_id", reason: "idea votes would be deleted"},
  {table: "memory_likes", column: "user_id", reason: "memory likes would be deleted"},
  {table: "memory_saves", column: "user_id", reason: "memory saves would be deleted"},
  {table: "memory_comments", column: "author_id", reason: "memory comments would be deleted"},
  {table: "memory_reactions", column: "user_id", reason: "memory reactions would be deleted"},
  {table: "poll_votes", column: "user_id", reason: "poll votes would be deleted"},
  {table: "user_follows", column: "follower_id", reason: "follow graph rows would be deleted"},
  {table: "user_follows", column: "following_id", reason: "follow graph rows would be deleted"},
  {table: "notifications", column: "user_id", reason: "notifications would be deleted"},
  {table: "notifications", column: "actor_id", reason: "notifications would be deleted"},
  {table: "community_shares", column: "owner_id", reason: "Fadla/community share rows would be deleted"},
  {table: "community_share_requests", column: "requester_id", reason: "Fadla request rows would be deleted"},
  {table: "community_credits", column: "user_id", reason: "received credit history would be deleted"},
];

const PRESERVED_ATTRIBUTION_REFERENCES = [
  {table: "posts", column: "author_id"},
  {table: "comments", column: "author_id"},
  {table: "ideas", column: "author_id"},
  {table: "memories", column: "contributor_id"},
  {table: "memory_media", column: "uploader_id"},
  {table: "reports", column: "reporter_id"},
  {table: "events", column: "creator_id"},
  {table: "projects", column: "creator_id"},
  {table: "polls", column: "creator_id"},
];

const SAFE_NULL_REFERENCES = [
  {table: "admin_audit_logs", column: "admin_id"},
  {table: "community_credits", column: "awarded_by"},
];

const OPTIONAL_ROLE_TABLE_DELETES = [
  {table: "user_roles", column: "user_id"},
  {table: "user_permissions", column: "user_id"},
  {table: "admin_permissions", column: "user_id"},
  {table: "role_assignments", column: "user_id"},
];

function parseArgs(argv) {
  const parsed = {_: []};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      parsed._.push(value);
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function usage() {
  console.log(`Usage:
  node scripts/admin-account-maintenance.mjs audit
  node scripts/admin-account-maintenance.mjs promote-phone --phone 37225588 [--execute]
  node scripts/admin-account-maintenance.mjs remove-legacy --user-id <uuid> --confirm-user-id <uuid> [--execute]

Environment:
  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Notes:
  - Commands are dry-run by default. Add --execute to write.
  - remove-legacy refuses to delete when rows would cascade-delete community/platform data.
  - Runtime admin access must be granted by profiles.role = 'admin'.`);
}

function requireEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return {supabaseUrl, serviceRoleKey};
}

function normalizeMauritaniaPhone(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  const withoutInternationalPrefix = digits.startsWith("00222") ? digits.slice(2) : digits;
  const localDigits = withoutInternationalPrefix.startsWith("222")
    ? withoutInternationalPrefix.slice(3)
    : withoutInternationalPrefix;

  return `+222${localDigits}`;
}

function toSyntheticPhoneEmail(normalizedPhone) {
  const normalized = normalizeMauritaniaPhone(normalizedPhone);
  const digits = normalized.replace(/\D/g, "");
  return `${digits}@${PHONE_DOMAIN}`;
}

function isSyntheticPhoneEmail(email) {
  return Boolean(email?.toLowerCase().endsWith(`@${PHONE_DOMAIN}`));
}

function isMissingRelation(error) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("relation") && message.includes("does not exist")
  );
}

function printJson(label, value) {
  console.log(`\n${label}`);
  console.log(JSON.stringify(value, null, 2));
}

async function listAllAuthUsers(admin) {
  const users = [];
  let page = 1;

  while (true) {
    const {data, error} = await admin.auth.admin.listUsers({page, perPage: 1000});
    if (error) throw error;

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < 1000) return users;
    page += 1;
  }
}

async function getAuthUser(admin, userId) {
  const {data, error} = await admin.auth.admin.getUserById(userId);
  if (error) {
    if (error.message?.toLowerCase().includes("not found")) return null;
    throw error;
  }

  return data?.user ?? null;
}

async function countRows(admin, table, column, userId) {
  const {count, error} = await admin
    .from(table)
    .select("*", {count: "exact", head: true})
    .eq(column, userId);

  if (error) {
    if (isMissingRelation(error)) return {table, column, count: 0, missing: true};
    throw error;
  }

  return {table, column, count: count ?? 0, missing: false};
}

async function collectReferenceCounts(admin, userId) {
  const blocking = [];
  const preservedAttribution = [];
  const safeNull = [];

  for (const reference of BLOCKING_REFERENCES) {
    const result = await countRows(admin, reference.table, reference.column, userId);
    if (result.count > 0) blocking.push({...reference, count: result.count});
  }

  for (const reference of PRESERVED_ATTRIBUTION_REFERENCES) {
    const result = await countRows(admin, reference.table, reference.column, userId);
    if (result.count > 0) preservedAttribution.push({...reference, count: result.count});
  }

  for (const reference of SAFE_NULL_REFERENCES) {
    const result = await countRows(admin, reference.table, reference.column, userId);
    if (result.count > 0) safeNull.push({...reference, count: result.count});
  }

  return {blocking, preservedAttribution, safeNull};
}

async function getProfile(admin, userId) {
  const {data, error} = await admin
    .from("profiles")
    .select("id, full_name, username, phone, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function audit(admin) {
  const [authUsers, profilesResult] = await Promise.all([
    listAllAuthUsers(admin),
    admin
      .from("profiles")
      .select("id, full_name, username, phone, role, created_at, updated_at")
      .in("role", ADMIN_ROLES)
      .order("created_at", {ascending: true}),
  ]);

  if (profilesResult.error) throw profilesResult.error;

  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const privilegedProfiles = profilesResult.data ?? [];
  const privilegedAccounts = privilegedProfiles.map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      role: profile.role,
      full_name: profile.full_name,
      username: profile.username,
      phone: profile.phone,
      email: authUser?.email ?? null,
      auth_kind: isSyntheticPhoneEmail(authUser?.email) ? "phone-synthetic" : "legacy-or-email",
      created_at: profile.created_at,
    };
  });

  const legacyPrivilegedAccounts = privilegedAccounts.filter(
    (account) => account.email && !isSyntheticPhoneEmail(account.email),
  );

  const orphanPrivilegedProfiles = privilegedAccounts.filter((account) => !authById.has(account.id));

  printJson("Privileged profiles", privilegedAccounts);
  printJson("Legacy/email-auth privileged candidates", legacyPrivilegedAccounts);
  printJson("Privileged profiles without auth user", orphanPrivilegedProfiles);

  const optionalRoleTables = [];
  for (const reference of OPTIONAL_ROLE_TABLE_DELETES) {
    try {
      const {count, error} = await admin
        .from(reference.table)
        .select("*", {count: "exact", head: true});

      if (error) {
        optionalRoleTables.push({
          table: reference.table,
          present: false,
          reason: isMissingRelation(error) ? "missing" : error.message,
        });
      } else {
        optionalRoleTables.push({table: reference.table, present: true, rows: count ?? 0});
      }
    } catch (error) {
      optionalRoleTables.push({table: reference.table, present: false, reason: error.message});
    }
  }

  printJson("Optional role/permission table probe", optionalRoleTables);
}

async function promotePhone(admin, args) {
  if (!args.phone) throw new Error("Missing --phone.");

  const normalizedPhone = normalizeMauritaniaPhone(args.phone);
  const syntheticEmail = toSyntheticPhoneEmail(normalizedPhone);

  const {data: profile, error} = await admin
    .from("profiles")
    .select("id, full_name, username, phone, role, created_at")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (error) throw error;
  if (!profile) {
    throw new Error(`No profile found for ${normalizedPhone}. Register the account normally first.`);
  }

  const authUser = await getAuthUser(admin, profile.id);
  if (!authUser) throw new Error(`Profile ${profile.id} has no matching auth user.`);
  if (authUser.email !== syntheticEmail) {
    throw new Error(
      `Refusing to promote: auth email is ${authUser.email}, expected ${syntheticEmail}.`,
    );
  }

  printJson("Promotion target", {
    id: profile.id,
    full_name: profile.full_name,
    username: profile.username,
    current_role: profile.role,
    normalized_phone: normalizedPhone,
    synthetic_email: syntheticEmail,
  });

  if (!args.execute) {
    console.log("\nDry run only. Re-run with --execute to set profiles.role = 'admin'.");
    return;
  }

  const {error: updateError} = await admin
    .from("profiles")
    .update({role: "admin"})
    .eq("id", profile.id);

  if (updateError) throw updateError;
  console.log(`Promoted ${profile.id} to role=admin.`);
}

async function removeLegacy(admin, args) {
  const userId = args["user-id"];
  const confirmUserId = args["confirm-user-id"];

  if (!userId || !confirmUserId) {
    throw new Error("Missing --user-id or --confirm-user-id.");
  }

  if (userId !== confirmUserId) {
    throw new Error("--confirm-user-id must exactly match --user-id.");
  }

  const [profile, authUser] = await Promise.all([
    getProfile(admin, userId),
    getAuthUser(admin, userId),
  ]);

  if (!profile && !authUser) {
    console.log(`No profile or auth user found for ${userId}. Nothing to remove.`);
    return;
  }

  if (authUser?.email && isSyntheticPhoneEmail(authUser.email)) {
    throw new Error(
      "Refusing to remove a phone-auth/synthetic-email user with remove-legacy. Use this only for legacy email admins.",
    );
  }

  if (profile?.role && profile.role !== "admin") {
    throw new Error(`Refusing to remove ${userId}: profile role is '${profile.role}', not 'admin'.`);
  }

  const references = await collectReferenceCounts(admin, userId);

  printJson("Removal target", {
    id: userId,
    profile,
    auth_email: authUser?.email ?? null,
  });
  printJson("Blocking references", references.blocking);
  printJson("Preserved attribution references", references.preservedAttribution);
  printJson("Safe nullable references", references.safeNull);

  if (references.blocking.length > 0) {
    throw new Error(
      "Refusing deletion because rows would cascade-delete community/platform data. Demote this profile first or migrate those references manually.",
    );
  }

  if (!args.execute) {
    console.log("\nDry run only. Re-run with --execute to demote, clean role references, delete profile, and delete auth user.");
    return;
  }

  if (profile) {
    const {error: demoteError} = await admin
      .from("profiles")
      .update({role: "member"})
      .eq("id", userId);

    if (demoteError) throw demoteError;
  }

  for (const reference of SAFE_NULL_REFERENCES) {
    const {error} = await admin
      .from(reference.table)
      .update({[reference.column]: null})
      .eq(reference.column, userId);

    if (error && !isMissingRelation(error)) throw error;
  }

  for (const reference of OPTIONAL_ROLE_TABLE_DELETES) {
    const {error} = await admin
      .from(reference.table)
      .delete()
      .eq(reference.column, userId);

    if (error && !isMissingRelation(error)) throw error;
  }

  if (profile) {
    const {error} = await admin.from("profiles").delete().eq("id", userId);
    if (error) throw error;
  }

  if (authUser) {
    const {error} = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  console.log(`Removed legacy admin identity ${userId}.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.help || args.h) {
    usage();
    return;
  }

  const {supabaseUrl, serviceRoleKey} = requireEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (command === "audit") {
    await audit(admin);
    return;
  }

  if (command === "promote-phone") {
    await promotePhone(admin, args);
    return;
  }

  if (command === "remove-legacy") {
    await removeLegacy(admin, args);
    return;
  }

  usage();
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
