#!/usr/bin/env node
/**
 * INDB Community OS — Performance Report Generator
 *
 * Analyzes seed data and generates a comprehensive performance report.
 *
 * Usage:
 *   node scripts/generate-report.mjs
 *
 * Requires env vars:
 *   SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD, SUPABASE_DB_NAME
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function query(sql, params = []) {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    await client.end();
  }
}

function elapsed(col) {
  return `EXTRACT(EPOCH FROM (NOW() - ${col}))::int`;
}

// ─── Collectors ──────────────────────────────────────────────────────────────

async function collectTableStats() {
  const tables = [
    "profiles", "posts", "comments", "memories", "ideas", "idea_votes",
    "idea_supporters", "idea_participants", "idea_messages", "community_shares",
    "community_share_requests", "fadla_request_messages", "notifications",
    "post_reactions", "user_follows",
  ];

  const stats = {};
  for (const table of tables) {
    const { rows } = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d
      FROM "${table}"
    `);
    stats[table] = rows[0];
  }
  return stats;
}

async function collectSlowQueries() {
  if (!DB_CONFIG.host) return [];

  try {
    const { rows } = await query(`
      SELECT
        query,
        calls,
        mean_exec_time::numeric(10,2),
        max_exec_time::numeric(10,2),
        p95_exec_time::numeric(10,2),
        rows,
        shared_blks_hit,
        shared_blks_read
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `);
    return rows;
  } catch {
    // pg_stat_statements might not be enabled
    return [{ note: "pg_stat_statements extension not available. Install with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" }];
  }
}

async function collectIndexUsage() {
  const { rows } = await query(`
    SELECT
      schemaname, tablename, indexname,
      idx_scan, idx_tup_read, idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC
    LIMIT 30
  `);
  return rows;
}

async function collectTableSizes() {
  const { rows } = await query(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  return rows;
}

async function collectConnectionStats() {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total_connections,
      COUNT(*) FILTER (WHERE state = 'active')::int AS active,
      COUNT(*) FILTER (WHERE state = 'idle')::int AS idle,
      COUNT(*) FILTER (WHERE state = 'idle in transaction')::int AS idle_in_txn
    FROM pg_stat_activity
    WHERE datname = current_database() AND pid <> pg_backend_pid()
  `);
  return rows[0];
}

async function collectLockStats() {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total_locks,
      COUNT(*) FILTER (WHERE locktype = 'relation')::int AS relation_locks,
      COUNT(*) FILTER (WHERE locktype = 'row')::int AS row_locks,
      COUNT(*) FILTER (WHERE locktype = 'transactionid')::int AS transaction_locks,
      COUNT(*) FILTER (WHERE granted = false)::int AS waiting_locks
    FROM pg_locks
    WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
  `);
  return rows[0];
}

async function collectCacheHitRatio() {
  const { rows } = await query(`
    SELECT
      ROUND((SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0))::numeric, 2) AS cache_hit_ratio,
      ROUND((SUM(idx_blks_hit) * 100.0 / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0))::numeric, 2) AS index_cache_hit_ratio
    FROM pg_statio_user_tables
  `);
  return rows[0] || { cache_hit_ratio: 0, index_cache_hit_ratio: 0 };
}

async function collectRealtimeStats() {
  const { rows } = await query(`
    SELECT
      COUNT(*)::int AS total_publication_tables
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
  `);
  return { total_publication_tables: rows[0]?.total_publication_tables ?? 0 };
}

async function collectAuthUserStats() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return { total: "N/A (no service role key)" };
  return { total: data.users.length };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Generating INDB Community OS Performance Report...\n");

  const report = {
    generatedAt: new Date().toISOString(),
    database: {
      version: null,
    },
    auth: {},
    tables: {},
    sizes: [],
    indexes: [],
    slowQueries: [],
    connections: {},
    locks: {},
    cache: {},
    realtime: {},
    recommendations: [],
    criticalIssues: [],
  };

  // DB version
  try {
    const { rows } = await query("SELECT version()");
    report.database.version = rows[0].version;
  } catch {}

  // Collect all stats
  report.tables = await collectTableStats();
  report.sizes = await collectTableSizes();
  report.indexes = await collectIndexUsage();
  report.slowQueries = await collectSlowQueries();
  report.connections = await collectConnectionStats();
  report.locks = await collectLockStats();
  report.cache = await collectCacheHitRatio();
  report.realtime = await collectRealtimeStats();
  report.auth = await collectAuthUserStats();

  // ─── Generate Recommendations ───────────────────────────────────────────

  const recs = [];
  const critical = [];

  // Cache hit ratio
  if (report.cache.cache_hit_ratio < 95) {
    critical.push(`Cache hit ratio is ${report.cache.cache_hit_ratio}% (target: >99%). Increase shared_buffers.`);
  }
  if (report.cache.index_cache_hit_ratio < 95) {
    recs.push(`Index cache hit ratio is ${report.cache.index_cache_hit_ratio}%. Consider increasing effective_cache_size.`);
  }

  // Waiting locks
  if (report.locks.waiting_locks > 0) {
    critical.push(`${report.locks.waiting_locks} queries waiting on locks. Check for long-running transactions.`);
  }

  // Connection usage
  if (report.connections.total_connections > 50) {
    recs.push(`High connection count: ${report.connections.total_connections}. Consider connection pooling (PgBouncer).`);
  }

  // Table size warnings
  for (const t of report.sizes) {
    const totalBytesMatch = (t.total_size || "").match(/([\d.]+)\s*(\w+)/);
    if (totalBytesMatch) {
      const val = parseFloat(totalBytesMatch[1]);
      const unit = totalBytesMatch[2];
      if ((unit === "GB" && val > 1) || (unit === "MB" && val > 500)) {
        recs.push(`Table "${t.table_name}" is large: ${t.total_size}. Consider archiving or partitioning.`);
      }
    }
  }

  // Real-time tables
  if (report.realtime.total_publication_tables < 8) {
    recs.push(`Only ${report.realtime.total_publication_tables} tables in realtime publication. Apply migration 20260720000000.`);
  }

  // Slow queries
  for (const q of report.slowQueries) {
    if (q.mean_exec_time > 1000) {
      recs.push(`Slow query (${q.mean_exec_time}ms avg, ${q.calls} calls): ${(q.query || "").slice(0, 100)}...`);
    }
  }

  // Unused indexes
  for (const idx of report.indexes) {
    if (idx.idx_scan === 0) {
      recs.push(`Unused index: "${idx.indexname}" on "${idx.tablename}" — consider dropping.`);
    }
  }

  // Active connections to locks ratio
  if (report.connections.active > 10 && report.locks.waiting_locks > 0) {
    critical.push(`${report.connections.active} active connections with ${report.locks.waiting_locks} waiting on locks. Connection pool may be saturated.`);
  }

  report.recommendations = recs;
  report.criticalIssues = critical;

  // ─── Write Report ──────────────────────────────────────────────────────

  const reportPath = path.resolve("./performance-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║            INDB Community OS — Performance Report            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("TABLE COUNTS:");
  for (const [name, stats] of Object.entries(report.tables)) {
    console.log(`  ${name.padEnd(30)} ${String(stats.total).padStart(6)} rows  (+${stats.last_24h} today, +${stats.last_7d} this week)`);
  }
  console.log("");
  console.log("TABLE SIZES:");
  for (const t of report.sizes) {
    console.log(`  ${t.table_name.padEnd(30)} ${(t.total_size || "?").padStart(10)}  rows=${t.row_count}`);
  }
  console.log("");
  console.log("DATABASE HEALTH:");
  console.log(`  Cache hit ratio:     ${report.cache.cache_hit_ratio ?? "N/A"}% (target: >99%)`);
  console.log(`  Index cache hit:     ${report.cache.index_cache_hit_ratio ?? "N/A"}%`);
  console.log(`  Connections:         ${report.connections.total_connections ?? "?"} (${report.connections.active ?? "?"} active)`);
  console.log(`  Locks:               ${report.locks.total_locks ?? "?"} total (${report.locks.waiting_locks ?? "?"} waiting)`);
  console.log(`  Realtime tables:     ${report.realtime.total_publication_tables ?? "?"}`);
  console.log(`  Auth users:          ${report.auth.total ?? "?"}`);
  console.log("");
  console.log("CRITICAL ISSUES:");
  if (critical.length === 0) console.log("  (none)");
  for (const issue of critical) console.log(`  ⚠  ${issue}`);
  console.log("");
  console.log("RECOMMENDATIONS:");
  if (recs.length === 0) console.log("  (none)");
  for (const rec of recs) console.log(`  • ${rec}`);
  console.log("");
  console.log(`Report saved to: ${reportPath}`);
}

main().catch((err) => {
  console.error("Report generation failed:", err.message);
  process.exit(1);
});
