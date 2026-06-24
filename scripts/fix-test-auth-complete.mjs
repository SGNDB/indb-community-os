#!/usr/bin/env node
/**
 * Fix test user phone numbers and synthetic auth emails.
 *
 * Root cause: original seed used wrong phone format:
 *   +2224600{00000} (13 chars, 9 local digits)
 * instead of:
 *   +22246{000000} (12 chars, 8 local digits)
 *
 * This fixes both the phone field and the auth email
 * so synthetic phone login works.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/fix-test-auth-complete.mjs
 */

import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TOTAL = 50;
let fixed = 0, skipped = 0, errors = 0;

function correctSynEmail(i) {
  return `22246${String(i).padStart(6,"0")}@phone.indb.local`;
}

function correctPhone(i) {
  return `+22246${String(i).padStart(6,"0")}`;
}

console.log(`Fixing phone + auth email for ${TOTAL} test users...\n`);

// First, collect all test users by matching on original or wrong emails
const { data } = await s.auth.admin.listUsers();
const allUsers = data.users;

for (let i = 0; i < TOTAL; i++) {
  const targetEmail = correctSynEmail(i);
  const targetPhone = correctPhone(i);
  const wrongEmail = `2224600${String(i).padStart(5,"0")}@phone.indb.local`;
  const oldEmail = `test.user${String(i).padStart(3,"0")}@indb-test.example.com`;

  // Find the user by any of the known emails
  let user = allUsers.find(u => u.email === targetEmail)
         || allUsers.find(u => u.email === wrongEmail)
         || allUsers.find(u => u.email === oldEmail);

  if (!user) {
    console.log(`  [${i+1}/${TOTAL}] NOT FOUND`);
    skipped++;
    continue;
  }

  const needsEmailFix = user.email !== targetEmail;
  const needsPhoneFix = user.phone !== targetPhone;

  if (!needsEmailFix && !needsPhoneFix) {
    console.log(`  [${i+1}/${TOTAL}] OK: ${targetEmail}`);
    skipped++;
    continue;
  }

  const updates = {};
  if (needsEmailFix) {
    updates.email = targetEmail;
    updates.email_confirm = true;
  }
  if (needsPhoneFix) {
    updates.phone = targetPhone;
    updates.phone_confirm = true;
  }

  const { error } = await s.auth.admin.updateUserById(user.id, updates);

  if (error) {
    console.error(`  [${i+1}/${TOTAL}] FAIL: ${error.message}`);
    errors++;
  } else {
    const what = [];
    if (needsEmailFix) what.push(`email:${user.email}→${targetEmail}`);
    if (needsPhoneFix) what.push(`phone:${user.phone}→${targetPhone}`);
    console.log(`  [${i+1}/${TOTAL}] FIXED: ${what.join(', ')}`);
    fixed++;
  }

  if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${errors} errors`);
console.log(`\nLogin with:\n  Phone: 46XXXXXX (type after +222 prefix)\n  Password: TestPass123!`);
console.log("  User 000 → type 46000000, password: TestPass123!");
