// k6/helpers.js — Shared auth & utility functions for all scenarios
// k6 runtime: no Node.js modules — uses k6/http, k6/crypto

import http from "k6/http";
import crypto from "k6/crypto";
import encoding from "k6/encoding";

/**
 * Login via Supabase Auth REST API using synthetic email.
 * Returns { accessToken, refreshToken, user } or null on failure.
 */
export function login(supabaseUrl, anonKey, email, password) {
  const url = `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: {
      "apikey": anonKey,
      "Content-Type": "application/json",
    },
    tags: { name: "auth_login" },
  };

  const res = http.post(url, payload, params);
  if (res.status !== 200) {
    console.error(`Login failed for ${email}: HTTP ${res.status} ${res.body}`);
    return null;
  }

  const body = res.json();
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    userId: body.user?.id,
    expiresIn: body.expires_in,
  };
}

/**
 * Linear interpolation for k6 ramping stages.
 */
export function stageTargets(scenarios) {
  const stages = [];
  const startTime = 0;
  for (const s of scenarios) {
    // Ramp up
    stages.push({ duration: `${s.duration}s`, target: s.vus });
    // Hold
    stages.push({ duration: `${s.hold}s`, target: s.vus });
    // Ramp down
    stages.push({ duration: `${s.duration}s`, target: 0 });
  }
  return stages;
}

/**
 * Generate a synthetic email for a given user index.
 */
export function syntheticEmail(userIndex) {
  // Match the seed script pattern: +2223XXXXXXX or +2224XXXXXXX
  const prefix = userIndex < 250 ? "3" : "4";
  const suffix = String(userIndex).padStart(7, "0");
  const digits = `222${prefix}${suffix}`;
  return `${digits}@phone.indb.local`;
}

/**
 * Build Supabase SSR auth cookie (sb-{project-ref}-auth-token)
 * from an access/refresh token pair.
 */
export function buildAuthCookie(supabaseUrl, accessToken, refreshToken) {
  // Extract project ref from URL: https://{ref}.supabase.co
  const match = supabaseUrl.match(/https?:\/\/([^.]+)/);
  if (!match) return null;
  const ref = match[1];
  const cookieName = `sb-${ref}-auth-token`;
  // The cookie value is base64url-encoded JSON: { access_token, refresh_token, ... }
  const payload = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
  });
  const encoded = encoding.b64encode(payload, "url");
  return { name: cookieName, value: encoded };
}

/**
 * Supabase REST headers for authenticated requests.
 */
export function authHeaders(accessToken, anonKey) {
  return {
    "apikey": anonKey,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Prefer": "count=exact",
  };
}

/**
 * Make authenticated GET to Supabase REST and return rows + headers.
 */
export function supabaseGet(supabaseUrl, path, accessToken, anonKey) {
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const res = http.get(url, {
    headers: authHeaders(accessToken, anonKey),
    tags: { name: `supa_${path.split("?")[0].replace(/\//g, "_")}` },
  });
  return res;
}

/**
 * Make authenticated POST to Supabase REST.
 */
export function supabasePost(supabaseUrl, path, body, accessToken, anonKey) {
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const res = http.post(url, JSON.stringify(body), {
    headers: authHeaders(accessToken, anonKey),
    tags: { name: `supa_post_${path.split("?")[0].replace(/\//g, "_")}` },
  });
  return res;
}
