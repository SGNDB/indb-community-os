// k6/scenarios/feed-browsing.js — Scenario A: 100 users browsing feed
import { check, sleep } from "k6";
import { login, supabaseGet, authHeaders } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

export let options = {
  scenarios: {
    feed_browsing: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "60s", target: 100 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
      tags: { scenario: "feed_browsing" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // Each VU uses a unique user index (0-99) based on VU id
  const vuId = __VU - 1;
  const email = `222${vuId < 250 ? "3" : "4"}${String(vuId).padStart(7, "0")}@phone.indb.local`;

  // Login
  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) {
    console.error(`VU ${__VU}: Login failed, skipping iteration`);
    sleep(10);
    return;
  }
  check(session, { "logged in": (s) => !!s.accessToken });

  // 1. Fetch feed posts (paginated)
  let res = supabaseGet(
    SUPABASE_URL,
    `posts?select=*,author:profiles!posts_author_id_fkey(*)&status=eq.published&order=created_at.desc&limit=20`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "feed posts loaded": (r) => r.status === 200 });
  sleep(1);

  // 2. Fetch categories
  res = supabaseGet(SUPABASE_URL, `categories?select=*&limit=50`, session.accessToken, ANON_KEY);
  check(res, { "categories loaded": (r) => r.status === 200 });
  sleep(0.5);

  // 3. Get my profile
  res = supabaseGet(SUPABASE_URL, `profiles?select=*&id=eq.${session.userId}&limit=1`, session.accessToken, ANON_KEY);
  check(res, { "profile loaded": (r) => r.status === 200 });
  sleep(0.5);

  // 4. Fetch user follows
  res = supabaseGet(
    SUPABASE_URL,
    `user_follows?select=following_id&follower_id=eq.${session.userId}&limit=50`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "follows loaded": (r) => r.status === 200 });
  sleep(0.5);

  // 5. Fetch unread notifications count
  res = supabaseGet(
    SUPABASE_URL,
    `notifications?select=id&user_id=eq.${session.userId}&read=eq.false&limit=100`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "notifications count loaded": (r) => r.status === 200 });
  sleep(1);
}
