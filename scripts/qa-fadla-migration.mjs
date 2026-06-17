#!/usr/bin/env node
/**
 * Fadla Migration QA — End-to-end workflow verification
 *
 * Tests:
 *   1. Migration applied (RPC exists, realtime tables, REPLICA IDENTITY)
 *   2. Fadla full workflow: create → request → accept → receiver confirms → sender confirms → completed
 *   3. Edge cases: double confirm, unauthorized confirm, already completed, no accepted request
 *
 * Usage:
 *   node scripts/qa-fadla-migration.mjs
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD (for direct verification)
 */

import pg from "pg";
import { createClient } from "@supabase/supabase-js";

// ─── Env ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

const hasDbAccess = DB_CONFIG.host && DB_CONFIG.user && DB_CONFIG.password;

let supabase;
if (SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function dbQuery(sql, params = []) {
  if (!hasDbAccess) return null;
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

// ─── Test Runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message}`);
      failed++;
    }
  };
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function checkMigrationApplied() {
  // 1. Check RPC function exists via DB
  const funcs = await dbQuery(
    "SELECT proname FROM pg_proc WHERE proname = 'confirm_fadla_action' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
  );
  if (funcs === null) throw new Error("No DB access — cannot verify");
  assert(funcs.length > 0, "confirm_fadla_action RPC not found");

  // 2. Check realtime tables
  const rt = await dbQuery(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public'"
  );
  const expectedRT = ["community_share_requests", "community_shares", "fadla_request_messages", "idea_messages", "idea_participants", "idea_supporters", "ideas", "notifications"];
  for (const t of expectedRT) {
    assert(rt.some(r => r.tablename === t), `Realtime table missing: ${t}`);
  }

  // 3. Check REPLICA IDENTITY FULL
  const ri = await dbQuery(
    "SELECT relname FROM pg_class WHERE relreplident = 'f' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
  );
  const expectedRI = ["community_share_requests", "idea_participants", "idea_supporters", "notifications"];
  for (const t of expectedRI) {
    assert(ri.some(r => r.relname === t), `REPLICA IDENTITY FULL missing: ${t}`);
  }
}

async function testFadlaFullWorkflow() {
  // Create two test users and run the full Fadla workflow
  const ts = Date.now();
  const phoneA = `+2223${String(ts).slice(-7)}`;
  const phoneB = `+2224${String(ts + 1).slice(-7)}`;
  const emailA = `${phoneA.slice(1)}@phone.indb.local`;
  const emailB = `${phoneB.slice(1)}@phone.indb.local`;
  const password = "QA-Test-2026!";

  // Create User A (owner)
  const { data: userA, error: errA } = await supabase.auth.admin.createUser({
    email: emailA, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Test A", username: `qa_a_${ts}`, phone: phoneA },
  });
  assert(!errA, `Create user A failed: ${errA?.message}`);
  const userAId = userA.user.id;

  // Create User B (receiver)
  const { data: userB, error: errB } = await supabase.auth.admin.createUser({
    email: emailB, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Test B", username: `qa_b_${ts}`, phone: phoneB },
  });
  assert(!errB, `Create user B failed: ${errB?.message}`);
  const userBId = userB.user.id;

  // Wait for triggers
  await new Promise(r => setTimeout(r, 2000));

  console.log(`    User A (owner):    ${emailA} / ${password}`);
  console.log(`    User B (receiver): ${emailB} / ${password}`);

  // Create Fadla item as User A (use anon client with service role)
  const { data: fadla, error: fErr } = await supabase
    .from("community_shares")
    .insert({
      owner_id: userAId,
      title: `QA Test Fadla ${ts}`,
      description: "QA test item for migration verification",
      category: "other",
      condition: "good",
      location: "Nouadhibou",
      quantity: 1,
      urgency_level: "no_urgency",
      status: "published",
      images: "[]",
    })
    .select("id")
    .single();
  assert(!fErr, `Create Fadla item failed: ${fErr?.message}`);
  const fadlaId = fadla.id;
  console.log(`    Fadla item ID: ${fadlaId}`);

  // User B requests
  const { data: req, error: rErr } = await supabase
    .from("community_share_requests")
    .insert({
      share_id: fadlaId,
      requester_id: userBId,
      message: "I would like this item please",
      status: "pending",
    })
    .select("id")
    .single();
  assert(!rErr, `Create request failed: ${rErr?.message}`);
  const requestId = req.id;

  // Accept via RPC
  const { data: acceptData, error: aErr } = await supabase.rpc("accept_fadla_request", {
    p_request_id: requestId,
    p_owner_id: userAId,
  });
  assert(!aErr, `Accept request failed: ${aErr?.message}`);
  const acceptResult = typeof acceptData === "string" ? JSON.parse(acceptData) : acceptData;
  assert(acceptResult.success, `Accept returned false: ${JSON.stringify(acceptResult)}`);

  // Verify status = 'reserved'
  const { data: shareAfterAccept } = await supabase
    .from("community_shares")
    .select("status, accepted_request_id")
    .eq("id", fadlaId)
    .single();
  assert(shareAfterAccept.status === "reserved", `Expected reserved, got ${shareAfterAccept.status}`);
  assert(shareAfterAccept.accepted_request_id === requestId, "Accepted request ID not set");

  // User B confirms received — use the RPC directly
  const { data: confirmReceived, error: crErr } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: fadlaId,
    p_user_id: userBId,
    p_confirmation_type: "received",
  });
  assert(!crErr, `Receiver confirm RPC failed: ${crErr?.message}`);
  const receivedResult = typeof confirmReceived === "string" ? JSON.parse(confirmReceived) : confirmReceived;
  assert(receivedResult.success, `Receiver confirm returned false: ${JSON.stringify(receivedResult)}`);
  assert(receivedResult.receiverConfirmedAt != null, "receiverConfirmedAt should be set");
  assert(receivedResult.senderConfirmedAt == null, "senderConfirmedAt should be null (only receiver confirmed)");
  assert(receivedResult.bothConfirmed === false, "bothConfirmed should be false (only receiver)");
  assert(receivedResult.shareStatus !== "completed", "Should not be completed yet");

  // Verify receiver_confirmed_at is set
  const { data: shareAfterReceived } = await supabase
    .from("community_shares")
    .select("receiver_confirmed_at, sender_confirmed_at, status")
    .eq("id", fadlaId)
    .single();
  assert(shareAfterReceived.receiver_confirmed_at != null, "receiver_confirmed_at not persisted");
  assert(shareAfterReceived.sender_confirmed_at == null, "sender_confirmed_at should be null");

  // User A confirms handed over
  const { data: confirmHanded, error: chErr } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: fadlaId,
    p_user_id: userAId,
    p_confirmation_type: "handed_over",
  });
  assert(!chErr, `Sender confirm RPC failed: ${chErr?.message}`);
  const handedResult = typeof confirmHanded === "string" ? JSON.parse(confirmHanded) : confirmHanded;
  assert(handedResult.success, `Sender confirm returned false: ${JSON.stringify(handedResult)}`);
  assert(handedResult.bothConfirmed === true, "bothConfirmed should be true after both confirm");
  assert(handedResult.shareStatus === "completed", `Expected completed, got ${handedResult.shareStatus}`);

  // Verify final state
  const { data: shareFinal } = await supabase
    .from("community_shares")
    .select("status, receiver_confirmed_at, sender_confirmed_at, completed_at")
    .eq("id", fadlaId)
    .single();
  assert(shareFinal.status === "completed", `Final status should be completed, got ${shareFinal.status}`);
  assert(shareFinal.receiver_confirmed_at != null, "receiver_confirmed_at should be set in final");
  assert(shareFinal.sender_confirmed_at != null, "sender_confirmed_at should be set in final");
  assert(shareFinal.completed_at != null, "completed_at should be set");

  console.log("    Full workflow: CREATED → REQUESTED → ACCEPTED → RECEIVED → HANDED_OVER → COMPLETED ✓");

  // Cleanup test users
  await supabase.auth.admin.deleteUser(userAId);
  await supabase.auth.admin.deleteUser(userBId);
  console.log("    Test users cleaned up ✓");
}

async function testDoubleConfirmFails() {
  const ts = Date.now();
  const phoneA = `+2223${String(ts + 10).slice(-7)}`;
  const phoneB = `+2224${String(ts + 11).slice(-7)}`;
  const emailA = `${phoneA.slice(1)}@phone.indb.local`;
  const emailB = `${phoneB.slice(1)}@phone.indb.local`;
  const password = "QA-Test-2026!";

  const { data: uA } = await supabase.auth.admin.createUser({
    email: emailA, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Double A", username: `qa_da_${ts}`, phone: phoneA },
  });
  const { data: uB } = await supabase.auth.admin.createUser({
    email: emailB, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Double B", username: `qa_db_${ts}`, phone: phoneB },
  });
  await new Promise(r => setTimeout(r, 2000));

  const { data: f } = await supabase.from("community_shares").insert({
    owner_id: uA.user.id, title: `QA Double Confirm ${ts}`, description: "test",
    category: "other", condition: "good", location: "Nouadhibou", quantity: 1,
    urgency_level: "no_urgency", status: "published", images: "[]",
  }).select("id").single();

  const { data: r } = await supabase.from("community_share_requests").insert({
    share_id: f.id, requester_id: uB.user.id, message: "test", status: "pending",
  }).select("id").single();

  await supabase.rpc("accept_fadla_request", { p_request_id: r.id, p_owner_id: uA.user.id });

  // First confirm (should succeed)
  const { data: c1 } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: f.id, p_user_id: uB.user.id, p_confirmation_type: "received",
  });
  const r1 = typeof c1 === "string" ? JSON.parse(c1) : c1;
  assert(r1.success, `First confirm should succeed: ${JSON.stringify(r1)}`);

  // Second confirm by same user (should fail)
  const { data: c2 } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: f.id, p_user_id: uB.user.id, p_confirmation_type: "received",
  });
  const r2 = typeof c2 === "string" ? JSON.parse(c2) : c2;
  assert(!r2.success, "Double confirm should fail");
  assert(r2.error === "already_confirmed", `Expected already_confirmed error, got ${r2.error}`);

  console.log("    Double confirm rejected ✓");

  // Cleanup
  await supabase.auth.admin.deleteUser(uA.user.id);
  await supabase.auth.admin.deleteUser(uB.user.id);
}

async function testUnauthorizedConfirmFails() {
  const ts = Date.now();
  const phoneA = `+2223${String(ts + 20).slice(-7)}`;
  const phoneB = `+2224${String(ts + 21).slice(-7)}`;
  const phoneC = `+2224${String(ts + 22).slice(-7)}`;
  const emailA = `${phoneA.slice(1)}@phone.indb.local`;
  const emailB = `${phoneB.slice(1)}@phone.indb.local`;
  const emailC = `${phoneC.slice(1)}@phone.indb.local`;
  const password = "QA-Test-2026!";

  const { data: uA } = await supabase.auth.admin.createUser({
    email: emailA, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Unauth A", username: `qa_ua_${ts}`, phone: phoneA },
  });
  const { data: uB } = await supabase.auth.admin.createUser({
    email: emailB, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Unauth B", username: `qa_ub_${ts}`, phone: phoneB },
  });
  const { data: uC } = await supabase.auth.admin.createUser({
    email: emailC, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Unauth C", username: `qa_uc_${ts}`, phone: phoneC },
  });
  await new Promise(r => setTimeout(r, 2000));

  const { data: f } = await supabase.from("community_shares").insert({
    owner_id: uA.user.id, title: `QA Unauthorized ${ts}`, description: "test",
    category: "other", condition: "good", location: "Nouadhibou", quantity: 1,
    urgency_level: "no_urgency", status: "published", images: "[]",
  }).select("id").single();

  const { data: r } = await supabase.from("community_share_requests").insert({
    share_id: f.id, requester_id: uB.user.id, message: "test", status: "pending",
  }).select("id").single();

  await supabase.rpc("accept_fadla_request", { p_request_id: r.id, p_owner_id: uA.user.id });

  // User C (not owner, not requester) tries to confirm received
  const { data: c1 } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: f.id, p_user_id: uC.user.id, p_confirmation_type: "received",
  });
  const r1 = typeof c1 === "string" ? JSON.parse(c1) : c1;
  assert(!r1.success, "Unauthorized receiver confirm should fail");
  assert(r1.error === "unauthorized", `Expected unauthorized, got ${r1.error}`);

  // User B (not owner) tries to confirm handed over
  const { data: c2 } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: f.id, p_user_id: uB.user.id, p_confirmation_type: "handed_over",
  });
  const r2 = typeof c2 === "string" ? JSON.parse(c2) : c2;
  assert(!r2.success, "Non-owner trying to hand over should fail");
  assert(r2.error === "unauthorized", `Expected unauthorized, got ${r2.error}`);

  console.log("    Unauthorized confirms rejected ✓");

  await supabase.auth.admin.deleteUser(uA.user.id);
  await supabase.auth.admin.deleteUser(uB.user.id);
  await supabase.auth.admin.deleteUser(uC.user.id);
}

async function testAlreadyCompletedFails() {
  const ts = Date.now();
  const phoneA = `+2223${String(ts + 30).slice(-7)}`;
  const phoneB = `+2224${String(ts + 31).slice(-7)}`;
  const emailA = `${phoneA.slice(1)}@phone.indb.local`;
  const emailB = `${phoneB.slice(1)}@phone.indb.local`;
  const password = "QA-Test-2026!";

  const { data: uA } = await supabase.auth.admin.createUser({
    email: emailA, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Completed A", username: `qa_ca_${ts}`, phone: phoneA },
  });
  const { data: uB } = await supabase.auth.admin.createUser({
    email: emailB, password, email_confirm: true, phone_confirm: true,
    user_metadata: { full_name: "QA Completed B", username: `qa_cb_${ts}`, phone: phoneB },
  });
  await new Promise(r => setTimeout(r, 2000));

  const { data: f } = await supabase.from("community_shares").insert({
    owner_id: uA.user.id, title: `QA Already Completed ${ts}`, description: "test",
    category: "other", condition: "good", location: "Nouadhibou", quantity: 1,
    urgency_level: "no_urgency", status: "completed", images: "[]",
  }).select("id").single();

  const { data: c } = await supabase.rpc("confirm_fadla_action", {
    p_share_id: f.id, p_user_id: uA.user.id, p_confirmation_type: "handed_over",
  });
  const r = typeof c === "string" ? JSON.parse(c) : c;
  assert(!r.success, "Already completed should fail");
  assert(r.error === "already_completed", `Expected already_completed, got ${r.error}`);

  console.log("    Already completed item rejected ✓");

  await supabase.auth.admin.deleteUser(uA.user.id);
  await supabase.auth.admin.deleteUser(uB.user.id);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Fadla Migration QA — Verification & End-to-End Testing    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");

  const tests = [];

  if (hasDbAccess) {
    tests.push(test("[Migration] Check migration is fully applied", checkMigrationApplied));
  } else {
    console.log("  ⚠ No DB access — skipping migration structure check");
    console.log("  Run manually: node scripts/check-migration-20000000.mjs\n");
  }

  if (supabase && SERVICE_ROLE_KEY) {
    tests.push(test("[Workflow] Full Fadla lifecycle (create→request→accept→both confirm→complete)", testFadlaFullWorkflow));
    tests.push(test("[Edge Case] Double confirm by same user fails", testDoubleConfirmFails));
    tests.push(test("[Edge Case] Unauthorized user confirm fails", testUnauthorizedConfirmFails));
    tests.push(test("[Edge Case] Already completed item rejects confirm", testAlreadyCompletedFails));
  } else {
    console.log("  ⚠ No service role key — skipping workflow tests");
  }

  for (const t of tests) {
    await t();
  }

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║   Results: ${passed} passed, ${failed} failed                       ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
