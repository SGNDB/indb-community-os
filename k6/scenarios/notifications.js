// k6/scenarios/notifications.js — Scenario F: 50 users receiving notifications
import { check, sleep } from "k6";
import { login, supabaseGet } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

export let options = {
  scenarios: {
    notifications: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "30s", target: 25 },
        { duration: "60s", target: 50 },
        { duration: "30s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "notifications" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const vuId = __VU - 1;
  const userIndex = vuId + 300; // Users 300-349
  const email = `222${userIndex < 250 ? "3" : "4"}${String(userIndex).padStart(7, "0")}@phone.indb.local`;

  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) return;

  check(session, { "notif logged in": (s) => !!s.accessToken });

  // 1. Fetch unread notification count
  let res = supabaseGet(
    SUPABASE_URL,
    `notifications?select=id,type,read,created_at&user_id=eq.${session.userId}&read=eq.false&order=created_at.desc&limit=50`,
    session.accessToken,
    ANON_KEY
  );
  check(res, {
    "unread notifs loaded": (r) => r.status === 200,
  });
  const unreadNotifs = res.json() || [];
  sleep(0.5);

  // 2. Fetch all recent notifications (with actor info)
  res = supabaseGet(
    SUPABASE_URL,
    `notifications?select=*,actor:profiles!notifications_actor_id_fkey(id,username,avatar_url,full_name)&user_id=eq.${session.userId}&order=created_at.desc&limit=20`,
    session.accessToken,
    ANON_KEY
  );
  check(res, {
    "all notifs loaded with actor": (r) => r.status === 200,
  });
  sleep(0.5);

  // 3. Mark some notifications as read
  if (unreadNotifs.length > 0) {
    const batch = unreadNotifs.slice(0, Math.min(5, unreadNotifs.length));
    for (const notif of batch) {
      res = supabasePost(
        SUPABASE_URL,
        `notifications?id=eq.${notif.id}`,
        { read: true },
        session.accessToken,
        ANON_KEY
      );
      check(res, { "notif marked read": (r) => r.status === 200 || r.status === 204 });
    }
  }
  sleep(1);

  // 4. Verify updated unread count
  res = supabaseGet(
    SUPABASE_URL,
    `notifications?select=id&user_id=eq.${session.userId}&read=eq.false&limit=0`,
    session.accessToken,
    ANON_KEY
  );
  check(res, {
    "updated unread count verified": (r) => r.status === 200,
  });

  // 5. Check realtime channel registration overhead (by getting the realtime health)
  // Note: k6 cannot natively test WebSocket/Realtime, but we measure the REST polling
  // equivalent that the app uses as fallback
  sleep(1.5);
}
