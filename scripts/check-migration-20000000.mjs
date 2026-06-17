import pg from "pg";

const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

async function query(sql, params = []) {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("=== Migration 20260720000000 — Status Check ===\n");

  // 1. Check RPC function exists
  const funcs = await query(
    "SELECT proname FROM pg_proc WHERE proname = 'confirm_fadla_action' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
  );
  console.log(`[1] confirm_fadla_action RPC: ${funcs.length > 0 ? "✓ EXISTS" : "✗ NOT FOUND"}`);

  // 2. Check realtime publication tables
  const rt = await query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' ORDER BY tablename"
  );
  const expectedRT = ["community_share_requests", "community_shares", "fadla_request_messages", "idea_messages", "idea_participants", "idea_supporters", "ideas", "notifications"];
  console.log(`[2] Realtime publication tables:`);
  let allRT = true;
  for (const t of expectedRT) {
    const found = rt.some(r => r.tablename === t);
    if (!found) allRT = false;
    console.log(`    ${found ? "✓" : "✗"} ${t}`);
  }
  console.log(`    Result: ${allRT ? "ALL PRESENT" : "MISSING TABLES"}`);

  // 3. Check REPLICA IDENTITY FULL
  const ri = await query(
    "SELECT relname FROM pg_class WHERE relreplident = 'f' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') ORDER BY relname"
  );
  const expectedRI = ["community_share_requests", "idea_participants", "idea_supporters", "notifications"];
  console.log(`[3] REPLICA IDENTITY FULL tables:`);
  let allRI = true;
  for (const t of expectedRI) {
    const found = ri.some(r => r.relname === t);
    if (!found) allRI = false;
    console.log(`    ${found ? "✓" : "✗"} ${t}`);
  }
  console.log(`    Result: ${allRI ? "ALL SET" : "MISSING"}`);

  // 4. Check migration tracking
  try {
    const mig = await query("SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20260720000000'");
    console.log(`[4] Migration tracked in schema_migrations: ${mig.length > 0 ? "✓ YES" : "✗ NO"}`);
  } catch {
    console.log(`[4] Migration tracking table not found (Supabase local only): N/A`);
  }

  // Summary
  const rpcOk = funcs.length > 0;
  console.log(`\n=== OVERALL: ${rpcOk && allRT && allRI ? "MIGRATION FULLY APPLIED" : "MIGRATION NOT APPLIED"} ===`);
  if (!rpcOk) console.log("  Fix: Run the SQL migration to create the RPC function");
  if (!allRT) console.log("  Fix: Add missing tables to supabase_realtime publication");
  if (!allRI) console.log("  Fix: ALTER REPLICA IDENTITY FULL on missing tables");
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
