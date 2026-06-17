// k6/scenarios/fadla-workflow.js — Scenario D: 50 users using Fadla
import { check, sleep } from "k6";
import { login, supabaseGet, supabasePost } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

const FADLA_TITLES = [
  "كتاب للتبرع", "ملابس أطفال", "أدوات مطبخ",
  "Livre à donner", "Vêtements bébé", "Ustensiles de cuisine",
];
const CATEGORIES = ["books", "clothes", "household", "tools", "electronics"];

export let options = {
  scenarios: {
    fadla_workflow: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "30s", target: 25 },
        { duration: "60s", target: 50 },
        { duration: "30s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "fadla_workflow" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<7000"],
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const vuId = __VU - 1;
  const userIndex = vuId + 200; // Users 200-249
  const email = `222${userIndex < 250 ? "3" : "4"}${String(userIndex).padStart(7, "0")}@phone.indb.local`;

  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) return;

  check(session, { "fadla logged in": (s) => !!s.accessToken });

  // 1. Fetch published Fadla items
  let res = supabaseGet(
    SUPABASE_URL,
    `community_shares?select=*,owner:profiles!community_shares_owner_id_fkey(id,username,avatar_url)&status=in.(published,requested,reserved)&order=created_at.desc&limit=20`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "fadla items loaded": (r) => r.status === 200 });
  sleep(0.5);

  // 2. Create a new Fadla item
  const newItem = {
    owner_id: session.userId,
    title: `${FADLA_TITLES[vuId % FADLA_TITLES.length]} [load-test-${__VU}]`,
    description: `Test item created during load testing by VU ${__VU}.`,
    category: CATEGORIES[vuId % CATEGORIES.length],
    condition: "good",
    location: "Nouadhibou",
    quantity: 1,
    urgency_level: "no_urgency",
    status: "published",
    images: "[]",
  };
  res = supabasePost(SUPABASE_URL, `community_shares`, newItem, session.accessToken, ANON_KEY);
  check(res, { "fadla item created": (r) => r.status === 201 });
  sleep(1);

  // 3. Try to request an existing item (not our own)
  const itemsRes = supabaseGet(
    SUPABASE_URL,
    `community_shares?select=id,owner_id&status=eq.published&limit=5`,
    session.accessToken,
    ANON_KEY
  );
  if (itemsRes.status === 200) {
    const items = itemsRes.json();
    if (items && items.length > 0) {
      const targetItem = items.find((i) => i.owner_id !== session.userId);
      if (targetItem) {
        const request = {
          share_id: targetItem.id,
          requester_id: session.userId,
          message: `I would like this item please [load-test-${__VU}]`,
          status: "pending",
        };
        res = supabasePost(SUPABASE_URL, `community_share_requests`, request, session.accessToken, ANON_KEY);
        check(res, { "fadla request created": (r) => r.status === 201 });
      }
    }
  }
  sleep(1);

  // 4. Check my requests
  res = supabaseGet(
    SUPABASE_URL,
    `community_share_requests?select=*,share:community_shares!community_share_requests_share_id_fkey(id,title)&requester_id=eq.${session.userId}&limit=10`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "my requests loaded": (r) => r.status === 200 });
  sleep(1.5);
}
