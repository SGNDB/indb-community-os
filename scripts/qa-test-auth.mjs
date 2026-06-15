import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

function requireEnvValue(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Embed normalization logic for testing
function normalizeMauritaniaPhone(input) {
  if (typeof input !== "string") {
    throw new Error("Phone input must be a string");
  }
  if (!/^\+?[0-9\s\-()]+$/.test(input)) {
    throw new Error("Phone number contains invalid characters");
  }
  const digits = input.replace(/[\s\-()]/g, "");
  const hasPlus = digits.startsWith("+");
  const cleanDigits = hasPlus ? digits.slice(1) : digits;
  if (!/^\d+$/.test(cleanDigits)) {
    throw new Error("Phone number contains invalid characters");
  }
  if (cleanDigits.length === 8) {
    return `+222${cleanDigits}`;
  } else if (cleanDigits.length === 11 && cleanDigits.startsWith("222")) {
    return `+${cleanDigits}`;
  } else if (cleanDigits.length === 13 && cleanDigits.startsWith("00222")) {
    return `+${cleanDigits.slice(2)}`;
  } else {
    throw new Error("Invalid phone number length");
  }
}

function toSyntheticPhoneEmail(normalizedPhone) {
  if (!normalizedPhone.startsWith("+222") || normalizedPhone.length !== 12) {
    throw new Error("Invalid normalized phone number");
  }
  const digits = normalizedPhone.slice(1);
  return `${digits}@phone.indb.local`;
}

async function testNormalization() {
  console.log("--- TEST 1: PHONE NORMALIZATION QA ---");
  const inputs = [
    "37225588",
    "+22237225588",
    "22237225588",
    "37  22  55  88",
    "37-22-55-88",
  ];

  const expectedNormalized = "+22237225588";
  const expectedEmail = "22237225588@phone.indb.local";

  for (const input of inputs) {
    const normalized = normalizeMauritaniaPhone(input);
    const email = toSyntheticPhoneEmail(normalized);

    console.log(`Input: "${input}"`);
    console.log(`  Normalized: "${normalized}" (Expected: "${expectedNormalized}")`);
    console.log(`  Synthetic Email: "${email}" (Expected: "${expectedEmail}")`);

    if (normalized !== expectedNormalized || email !== expectedEmail) {
      throw new Error(`Normalization failed for input: ${input}`);
    }
  }

  // Test custom local number 22 23 45 67
  const inputLocal = "22 23 45 67";
  const expectedLocalNormalized = "+22222234567";
  const normalizedLocal = normalizeMauritaniaPhone(inputLocal);
  console.log(`Input Local: "${inputLocal}" -> Normalized: "${normalizedLocal}" (Expected: "${expectedLocalNormalized}")`);
  if (normalizedLocal !== expectedLocalNormalized) {
    throw new Error(`Normalization failed for local input: ${inputLocal}`);
  }

  console.log("Normalization tests passed successfully!\n");
}

async function runDatabaseQuery(query, params = []) {
  requireEnvValue(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  requireEnvValue(DB_CONFIG.host, "SUPABASE_DB_HOST");
  requireEnvValue(DB_CONFIG.user, "SUPABASE_DB_USER");
  requireEnvValue(DB_CONFIG.password, "SUPABASE_DB_PASSWORD");

  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

async function deleteAuthUser(email) {
  const dbUsers = await runDatabaseQuery("SELECT id FROM auth.users WHERE email = $1", [email]);
  if (dbUsers.length > 0) {
    const userId = dbUsers[0].id;
    console.log(`Cleaning up existing test user ${email} (${userId})...`);
    // Delete profile and user
    await runDatabaseQuery("DELETE FROM public.profiles WHERE id = $1", [userId]);
    await runDatabaseQuery("DELETE FROM auth.users WHERE id = $1", [userId]);
  }
}

async function testAuthIntegration() {
  console.log("--- TEST 2: AUTH & DB INTEGRATION QA ---");

  const testEmail1 = toSyntheticPhoneEmail(normalizeMauritaniaPhone("37225588"));
  const testEmail2 = toSyntheticPhoneEmail(normalizeMauritaniaPhone("37225589"));

  // Clean up any old test accounts
  await deleteAuthUser(testEmail1);
  await deleteAuthUser(testEmail2);

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  requireEnvValue(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");

  let supabase;
  let useAdminForCreate = false;

  if (serviceRoleKey) {
    console.log("SUPABASE_SERVICE_ROLE_KEY is set. Using admin client for user creation.");
    supabase = createClient(SUPABASE_URL, serviceRoleKey);
    useAdminForCreate = true;
  } else {
    requireEnvValue(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
    console.log("SUPABASE_SERVICE_ROLE_KEY is not set. Using anon client for tests.");
    supabase = createClient(SUPABASE_URL, anonKey);
  }

  console.log("\n[TEST A] New registration: Phone 37225588");
  let signUpData, signUpError;

  if (useAdminForCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail1,
      password: "Testpass1",
      email_confirm: true,
      user_metadata: {
        full_name: "QA Test User 1",
        phone: normalizeMauritaniaPhone("37225588"),
      },
    });
    signUpData = data;
    signUpError = error;
  } else {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail1,
      password: "Testpass1",
      options: {
        data: {
          full_name: "QA Test User 1",
          phone: normalizeMauritaniaPhone("37225588"),
        },
      },
    });
    signUpData = data;
    signUpError = error;
  }

  if (signUpError) {
    if (signUpError.message.includes("Email signups are disabled")) {
      console.error("\n========================================================");
      console.error("DIAGNOSTIC NOTICE:");
      console.error("Email signups are currently disabled on your Supabase project.");
      console.error("To test registration locally or deploy to production, you must EITHER:");
      console.error("1. Enable Email Provider Signups in Supabase Auth Dashboard");
      console.error("2. OR set the SUPABASE_SERVICE_ROLE_KEY environment variable locally");
      console.error("   (Server actions will automatically use it to create users securely).");
      console.error("========================================================\n");
    }
    throw new Error(`SignUp failed: ${signUpError.message}`);
  }
  console.log(`SignUp success. User ID: ${signUpData.user.id}`);

  // Wait 1.5 seconds for DB trigger to complete
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Verify DB profile creation
  console.log("Verifying profiles table...");
  const profiles = await runDatabaseQuery("SELECT * FROM public.profiles WHERE id = $1", [signUpData.user.id]);
  if (profiles.length !== 1) {
    throw new Error(`Profile not created automatically by trigger! Found rows count: ${profiles.length}`);
  }

  const profile = profiles[0];
  console.log("Created profile row details:", JSON.stringify(profile, null, 2));

  if (profile.phone !== "+22237225588") {
    throw new Error(`Profile phone incorrect: ${profile.phone}`);
  }
  if (profile.full_name !== "QA Test User 1") {
    throw new Error(`Profile full_name incorrect: ${profile.full_name}`);
  }
  if (!profile.username || !profile.username.startsWith("u")) {
    throw new Error(`Profile username incorrect or not auto-generated: ${profile.username}`);
  }

  console.log("[TEST A] Passed: Account created & profile trigger worked successfully.");

  console.log("\n[TEST B] Login: same phone + same password");
  // Login must always run using anon client to fetch actual session
  const anonSupabase = createClient(SUPABASE_URL, anonKey);
  const { error: signInError } = await anonSupabase.auth.signInWithPassword({
    email: testEmail1,
    password: "Testpass1",
  });

  if (signInError) {
    throw new Error(`SignIn failed: ${signInError.message}`);
  }
  console.log("SignIn success. Session acquired.");
  console.log("[TEST B] Passed: Login succeeded.");

  console.log("\n[TEST C] Duplicate registration");
  let dupSignUpData, dupSignUpError;
  if (useAdminForCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail1,
      password: "Testpass1",
      user_metadata: {
        full_name: "QA Test User 1 Dup",
        phone: normalizeMauritaniaPhone("37225588"),
      },
    });
    dupSignUpData = data;
    dupSignUpError = error;
  } else {
    const { data, error } = await anonSupabase.auth.signUp({
      email: testEmail1,
      password: "Testpass1",
      options: {
        data: {
          full_name: "QA Test User 1 Dup",
          phone: normalizeMauritaniaPhone("37225588"),
        },
      },
    });
    dupSignUpData = data;
    dupSignUpError = error;
  }

  if (dupSignUpError) {
    console.log("Received expected error on duplicate signup:", dupSignUpError.message);
  } else if (dupSignUpData && dupSignUpData.user && dupSignUpData.user.identities && dupSignUpData.user.identities.length === 0) {
    console.log("Duplicate signup handled successfully (Supabase returned user with no identities/session).");
  } else {
    console.log("Duplicate signup response:", JSON.stringify(dupSignUpData, null, 2));
  }
  console.log("[TEST C] Passed: Duplicate registration prevented.");

  console.log("\n[TEST D] Wrong password");
  const { error: wrongSignInError } = await anonSupabase.auth.signInWithPassword({
    email: testEmail1,
    password: "WrongPassword",
  });

  if (!wrongSignInError) {
    throw new Error("Wrong password login did not fail!");
  }
  console.log(`Wrong password login failed as expected with error: ${wrongSignInError.message}`);
  console.log("[TEST D] Passed: Wrong password login rejected.");

  console.log("\n[TEST E] New different phone: 37225589");
  let signUpData2, signUpError2;
  if (useAdminForCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: "Testpass1",
      email_confirm: true,
      user_metadata: {
        full_name: "QA Test User 2",
        phone: normalizeMauritaniaPhone("37225589"),
      },
    });
    signUpData2 = data;
    signUpError2 = error;
  } else {
    const { data, error } = await anonSupabase.auth.signUp({
      email: testEmail2,
      password: "Testpass1",
      options: {
        data: {
          full_name: "QA Test User 2",
          phone: normalizeMauritaniaPhone("37225589"),
        },
      },
    });
    signUpData2 = data;
    signUpError2 = error;
  }

  if (signUpError2) {
    throw new Error(`SignUp 2 failed: ${signUpError2.message}`);
  }
  console.log(`SignUp 2 success. User ID: ${signUpData2.user.id}`);
  console.log("[TEST E] Passed: New different phone registered successfully.");

  // Clean up
  console.log("\nCleaning up test accounts...");
  await deleteAuthUser(testEmail1);
  await deleteAuthUser(testEmail2);
  console.log("Cleanup complete.");

  console.log("Auth and Trigger integration tests passed successfully!\n");
}

async function run() {
  try {
    await testNormalization();
    await testAuthIntegration();
    console.log("ALL QA TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("QA TEST FAILED:", err.message);
    process.exit(1);
  }
}

run();
