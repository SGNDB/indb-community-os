#!/usr/bin/env -S npx tsx
/**
 * Graatek Event Logging QA — verifies the real publishPlatformEvent -> logger
 * subscriber -> event_logs pipeline for graatek.requested / graatek.completed,
 * using the actual application code (not a reimplementation).
 *
 * All rows created here are tagged is_test = true and are deleted at the end
 * of the run, regardless of pass/fail.
 *
 * Usage:
 *   npx tsx scripts/qa-graatek-events.ts
 *
 * Requires env vars (see scripts/qa-fadla-migration.mjs for the same pattern):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.qa-graatek");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let passed = 0;
let failed = 0;
function assert(condition: unknown, msg: string) {
  if (!condition) throw new Error(msg);
}
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

function scanForPii(row: unknown, label: string) {
  const json = JSON.stringify(row);
  assert(!/\+222\d{7,}/.test(json), `${label}: contains a phone-number-like string`);
  assert(!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(json), `${label}: contains an email-like string`);
  assert(!/would like this item/i.test(json), `${label}: contains request message body text`);
}

async function main() {
  const { publishPlatformEvent } = await import("@/core/events/platform-events");
  const { registerEventSubscribers } = await import("@/core/events/subscribers");
  const { getAdminEventLogs } = await import("../app/[locale]/admin/events/actions");

  registerEventSubscribers();

  const ts = Date.now();
  const phoneA = `+2223${String(ts).slice(-7)}`;
  const phoneB = `+2224${String(ts + 1).slice(-7)}`;
  const emailA = `${phoneA.slice(1)}@phone.indb.local`;
  const emailB = `${phoneB.slice(1)}@phone.indb.local`;
  const password = "QA-Test-2026!";

  let userAId = "";
  let userBId = "";
  let itemId = "";
  let requestId = "";

  await step("Create test users A (owner) and B (requester)", async () => {
    const { data: userA, error: errA } = await supabase.auth.admin.createUser({
      email: emailA, password, email_confirm: true, phone_confirm: true,
      user_metadata: { full_name: "QA Events A", username: `qa_ev_a_${ts}`, phone: phoneA },
    });
    assert(!errA, `Create user A failed: ${errA?.message}`);
    userAId = userA!.user!.id;

    const { data: userB, error: errB } = await supabase.auth.admin.createUser({
      email: emailB, password, email_confirm: true, phone_confirm: true,
      user_metadata: { full_name: "QA Events B", username: `qa_ev_b_${ts}`, phone: phoneB },
    });
    assert(!errB, `Create user B failed: ${errB?.message}`);
    userBId = userB!.user!.id;

    await new Promise((r) => setTimeout(r, 2000));
    await supabase.from("profiles").update({ is_test: true }).in("id", [userAId, userBId]);
  });

  await step("Create Graatek test item (status=published)", async () => {
    const { data, error } = await supabase
      .from("community_shares")
      .insert({
        owner_id: userAId,
        title: `QA Events Fadla ${ts}`,
        description: "QA test item for event-log verification",
        category: "other",
        condition: "good",
        location: "Nouadhibou",
        quantity: 1,
        urgency_level: "no_urgency",
        status: "published",
        images: "[]",
        is_test: true,
      })
      .select("id")
      .single();
    assert(!error, `Create item failed: ${error?.message}`);
    itemId = data!.id;
  });

  await step("User B requests the item (mirrors requestFadlaItemAction)", async () => {
    const { data: req, error: rErr } = await supabase
      .from("community_share_requests")
      .insert({
        share_id: itemId,
        requester_id: userBId,
        message: "I would like this item please",
        status: "pending",
        is_test: true,
      })
      .select("id")
      .single();
    assert(!rErr, `Create request failed: ${rErr?.message}`);
    requestId = req!.id;

    const { error: statusError } = await supabase
      .from("community_shares")
      .update({ status: "requested", updated_at: new Date().toISOString() })
      .eq("id", itemId);
    assert(!statusError, `Status update failed: ${statusError?.message}`);
  });

  await step("Publish graatek.requested via the real publishPlatformEvent()", async () => {
    await publishPlatformEvent({
      name: "graatek.requested",
      actorId: userBId,
      entityType: "community_share",
      entityId: itemId,
    });
    // Give the async admin-client insert a moment to land.
    await new Promise((r) => setTimeout(r, 800));
  });

  await step("graatek.requested appears in /admin/events with correct shape, no PII", async () => {
    const logs = await getAdminEventLogs(500);
    const entry = logs.find((l) => l.event_name === "graatek.requested" && l.entity_id === itemId);
    assert(entry, "graatek.requested not found in event_logs via getAdminEventLogs()");
    assert(entry!.actor_id === userBId, `actor_id mismatch: ${entry!.actor_id}`);
    assert(entry!.entity_type === "community_share", `entity_type mismatch: ${entry!.entity_type}`);
    const metaKeys = Object.keys(entry!.metadata ?? {});
    assert(metaKeys.length === 1 && metaKeys[0] === "occurredAt", `metadata has unexpected keys: ${metaKeys.join(",")}`);
    scanForPii(entry, "graatek.requested event_logs row");
  });

  await step("Accept request + both-side confirmation (real RPCs)", async () => {
    const { data: acceptData, error: aErr } = await supabase.rpc("accept_fadla_request", {
      p_request_id: requestId,
      p_owner_id: userAId,
    });
    assert(!aErr, `Accept failed: ${aErr?.message}`);
    const acceptResult = typeof acceptData === "string" ? JSON.parse(acceptData) : acceptData;
    assert(acceptResult.success, `Accept returned false: ${JSON.stringify(acceptResult)}`);

    const { data: received, error: rcErr } = await supabase.rpc("confirm_fadla_action", {
      p_share_id: itemId,
      p_user_id: userBId,
      p_confirmation_type: "received",
    });
    assert(!rcErr, `Receiver confirm failed: ${rcErr?.message}`);
    const receivedResult = typeof received === "string" ? JSON.parse(received) : received;
    assert(receivedResult.success, `Receiver confirm returned false: ${JSON.stringify(receivedResult)}`);

    const { data: handed, error: hErr } = await supabase.rpc("confirm_fadla_action", {
      p_share_id: itemId,
      p_user_id: userAId,
      p_confirmation_type: "handed_over",
    });
    assert(!hErr, `Sender confirm failed: ${hErr?.message}`);
    const handedResult = typeof handed === "string" ? JSON.parse(handed) : handed;
    assert(handedResult.success, `Sender confirm returned false: ${JSON.stringify(handedResult)}`);
    assert(handedResult.bothConfirmed === true, "bothConfirmed should be true");
    assert(handedResult.shareStatus === "completed", `Expected completed, got ${handedResult.shareStatus}`);
  });

  await step("Publish graatek.completed via the real publishPlatformEvent()", async () => {
    // Mirrors confirmFadlaHandedOverAction: sender (owner) is the actor on the
    // confirmation that flips bothConfirmed to true.
    await publishPlatformEvent({
      name: "graatek.completed",
      actorId: userAId,
      entityType: "community_share",
      entityId: itemId,
    });
    await new Promise((r) => setTimeout(r, 800));
  });

  await step("graatek.completed appears in /admin/events with correct shape, no PII", async () => {
    const logs = await getAdminEventLogs(500);
    const entry = logs.find((l) => l.event_name === "graatek.completed" && l.entity_id === itemId);
    assert(entry, "graatek.completed not found in event_logs via getAdminEventLogs()");
    assert(entry!.actor_id === userAId, `actor_id mismatch: ${entry!.actor_id}`);
    assert(entry!.entity_type === "community_share", `entity_type mismatch: ${entry!.entity_type}`);
    const metaKeys = Object.keys(entry!.metadata ?? {});
    assert(metaKeys.length === 1 && metaKeys[0] === "occurredAt", `metadata has unexpected keys: ${metaKeys.join(",")}`);
    scanForPii(entry, "graatek.completed event_logs row");
  });

  // ─── Cleanup ────────────────────────────────────────────────────────────
  console.log("\n  Cleaning up test data...");
  await supabase.from("event_logs").delete().eq("entity_id", itemId);
  await supabase.from("community_share_requests").delete().eq("share_id", itemId);
  await supabase.from("community_shares").delete().eq("id", itemId);
  if (userAId) await supabase.auth.admin.deleteUser(userAId);
  if (userBId) await supabase.auth.admin.deleteUser(userBId);
  console.log("  Test data removed.\n");

  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
