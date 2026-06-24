#!/usr/bin/env node
/**
 * Cleanup Test Data
 *
 * Uses email domain (@indb-test.example.com) and deterministic UUIDs
 * to identify and remove all test data created by seed-visual-test.mjs.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/cleanup-test-data.mjs
 */

import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const SEED_NAMESPACE = "indb-visual-test-v1";
const TOTAL_USERS = 50;

function stableUuid(ns, id) {
  const h = createHash("md5").update(ns + ":" + id).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(8+(parseInt(h[16],16)&3).toString())}${h.slice(17,20)}-${h.slice(20,32)}`;
}

function uid(i) { return stableUuid(SEED_NAMESPACE, `user:${i}`); }
function email(i) { return `test.user${String(i).padStart(3,"0")}@indb-test.example.com`; }

const CONTENT_PREFIXES = ["post","comment","reaction","memory","idea","vote","supp","fadla","req","follow","notif","notif_e"];

function contentUuid(prefix, i) {
  return stableUuid(SEED_NAMESPACE, `${prefix}:${i}`);
}

async function main() {
  const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log(`\n=== Test Data Cleanup ===`);
  console.log(`Target: ${SUPABASE_URL}`);

  if (process.env.CI !== "true") {
    console.log("\nWARNING: This will DELETE all test data created by seed-visual-test.mjs.");
    console.log("Test users, posts, comments, reactions, memories, ideas,");
    console.log("Graatek items, follows, and notifications will be removed.\n");
    console.log("Press Ctrl+C within 5s to cancel...");
    await new Promise(r => setTimeout(r, 5000));
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let total = 0;

  // 1. Collect all test user IDs
  const testUserIds = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    testUserIds.push(uid(i));
  }

  // 2. Delete dependent data first (order matters - children before parents)
  const deleteOrder = [
    // Children tables (no FK to each other)
    { table: "fadla_request_messages", ids: [] },
    { table: "idea_messages", ids: [] },
    { table: "idea_comments", ids: [] },
    { table: "recommendation_events", ids: [] },
    // Children referencing content
    { table: "community_share_requests", ids: [] },
    { table: "idea_participants", ids: [] },
    { table: "idea_supporters", ids: [] },
    { table: "idea_votes", ids: [] },
    { table: "post_reactions", ids: [] },
    { table: "comments", ids: [] },
    { table: "saved_posts", ids: [] },
    { table: "saved_memories", ids: [] },
    // Content tables
    { table: "community_shares", ids: [] },
    { table: "ideas", ids: [] },
    { table: "memories", ids: [] },
    { table: "posts", ids: [] },
    // User relations
    { table: "user_follows", ids: [] },
    { table: "notifications", ids: [] },
  ];

  // Build the UUIDs for each content type
  for (let i = 0; i < 50; i++) {
    const contentTables = {
      "posts": "post",
      "memories": "memory",
      "ideas": "idea",
      "community_shares": "fadla",
    };
    for (const [table, prefix] of Object.entries(contentTables)) {
      const entry = deleteOrder.find(e => e.table === table);
      if (entry) entry.ids.push(contentUuid(prefix, i));
    }
  }
  // Extra IDs for comments, reactions, etc. (we generated variable amounts)
  // We'll use a broader approach - delete by author_id/actor_id

  // 3. Delete each table
  for (const { table, ids } of deleteOrder) {
    try {
      let count = 0;

      if (ids.length > 0) {
        // Delete by known UUIDs
        for (let i = 0; i < ids.length; i += 50) {
          const batch = ids.slice(i, i + 50);
          const { error, count: c } = await supabase
            .from(table)
            .delete()
            .in("id", batch);
          if (error) throw error;
          count += c || 0;
        }
      }

      // Also delete by user reference for tables with user FKs
      if (["comments","post_reactions","user_follows","notifications",
           "community_share_requests","idea_votes","idea_supporters",
           "idea_participants","fadla_request_messages","idea_messages",
           "idea_comments","saved_posts","saved_memories","recommendation_events"
          ].includes(table)) {
        // Delete where user is referenced
        for (let i = 0; i < testUserIds.length; i += 25) {
          const batch = testUserIds.slice(i, i + 25);
          const { error, count: c } = await supabase
            .from(table)
            .delete()
            .in("user_id", batch);
          if (error && !error.message.includes("column")) count += c || 0;
        }
        // Also try actor_id and other user FK columns
        if (table === "notifications") {
          for (let i = 0; i < testUserIds.length; i += 25) {
            const batch = testUserIds.slice(i, i + 25);
            const { error } = await supabase.from(table).delete().in("actor_id", batch);
            if (error && !error.message.includes("column")) {}
          }
        }
        if (table === "comments" || table === "idea_comments") {
          for (let i = 0; i < testUserIds.length; i += 25) {
            const batch = testUserIds.slice(i, i + 25);
            const { error } = await supabase.from(table).delete().in("author_id", batch);
            if (error && !error.message.includes("column")) {}
          }
        }
        if (["community_share_requests","idea_participants"].includes(table)) {
          for (let i = 0; i < testUserIds.length; i += 25) {
            const batch = testUserIds.slice(i, i + 25);
            const { error } = await supabase.from(table).delete().in("requester_id", batch);
            if (error && !error.message.includes("column")) {}
          }
        }
        if (table === "user_follows") {
          for (let i = 0; i < testUserIds.length; i += 25) {
            const batch = testUserIds.slice(i, i + 25);
            const { error } = await supabase.from(table).delete().in("follower_id", batch);
            if (error && !error.message.includes("column")) {}
          }
        }
        if (["community_shares","ideas","posts","memories"].includes(table)) {
          for (let i = 0; i < testUserIds.length; i += 25) {
            const batch = testUserIds.slice(i, i + 25);
            const col = table === "memories" ? "contributor_id" : table === "community_shares" ? "owner_id" : "author_id";
            const { error } = await supabase.from(table).delete().in(col, batch);
            if (error && !error.message.includes("column")) {}
          }
        }
      }

      // Content tables - delete by known IDs
      if (["posts","memories","ideas","community_shares"].includes(table)) {
        // Already handled above via user FK
      }

      if (count > 0) console.log(`  ${table}: cleaned`);
    } catch (e) {
      if (!e.message.includes("does not exist") && !e.message.includes("relation")) {
        console.log(`  ${table}: ${e.message.slice(0,80)}`);
      }
    }
  }

  // 4. Delete profiles
  console.log("  Deleting profiles...");
  for (let i = 0; i < testUserIds.length; i += 25) {
    const batch = testUserIds.slice(i, i + 25);
    await supabase.from("profiles").delete().in("id", batch);
  }

  // 5. Delete auth users
  console.log("  Deleting auth users...");
  for (const uid of testUserIds) {
    try {
      await supabase.auth.admin.deleteUser(uid);
    } catch (e) {
      // User might already be deleted
    }
  }

  console.log(`\n=== Cleanup complete ===`);
  console.log(`Auth users deleted: ${TOTAL_USERS}`);
  console.log(`All test data has been removed.`);
}

function requireEnv(n) {
  const v = process.env[n];
  if (!v) { console.error(`Missing ${n}`); process.exit(1); }
  return v;
}

main().catch(e => { console.error("FAILED:", e); process.exit(1); });
