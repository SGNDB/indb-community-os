import pg from "pg";
import {readFileSync} from "fs";
import {resolve, dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const {Client} = pg;

async function main() {
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
    database: process.env.SUPABASE_DB_NAME ?? "postgres",
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {rejectUnauthorized: false},
  });

  const missingEnv = [
    ["SUPABASE_DB_HOST", process.env.SUPABASE_DB_HOST],
    ["SUPABASE_DB_USER", process.env.SUPABASE_DB_USER],
    ["SUPABASE_DB_PASSWORD", process.env.SUPABASE_DB_PASSWORD],
  ].filter(([, value]) => !value);

  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missingEnv.map(([name]) => name).join(", ")}`);
  }

  await client.connect();
  console.log("Connected to Supabase PostgreSQL.");

  const migrationPath = resolve(__dirname, "../supabase/migrations/20260601090000_initial_schema.sql");
  const seedPath = resolve(__dirname, "../supabase/seed.sql");

  const migrationSQL = readFileSync(migrationPath, "utf-8");
  const seedSQL = readFileSync(seedPath, "utf-8");

  console.log("Running migration...");
  await client.query(migrationSQL);
  console.log("Migration complete.");

  console.log("Running seed...");
  await client.query(seedSQL);
  console.log("Seed complete.");

  await client.end();
  console.log("Done. Database is ready.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
