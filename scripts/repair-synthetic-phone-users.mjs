#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase admin environment variables.');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function listAllUsers() {
  const allUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    allUsers.push(...(data?.users ?? []));

    if ((data?.users?.length ?? 0) < 1000) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

try {
  const users = await listAllUsers();
  const syntheticUsers = users.filter((user) => {
    const isSyntheticPhoneUser = user.email?.endsWith('@phone.indb.local');
    const needsConfirmation = !user.email_confirmed_at;
    return isSyntheticPhoneUser && needsConfirmation;
  });

  console.log(`Found ${syntheticUsers.length} unconfirmed synthetic phone user(s) to repair.`);

  for (const user of syntheticUsers) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (error) {
      console.error(`Failed to confirm user ${user.id}:`, error);
      continue;
    }

    console.log(`Confirmed user ${user.id} (${user.email})`);
  }

  console.log('Repair complete.');
} catch (error) {
  console.error('Repair script failed:', error);
  process.exit(1);
}
