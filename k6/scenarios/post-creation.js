// k6/scenarios/post-creation.js — Scenario B: 50 users creating posts
import { check, sleep } from "k6";
import { login, supabasePost, supabaseGet } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

const POST_TYPES = ["community", "news", "memory", "event", "idea", "project"];
const CONTENT_TEMPLATES = [
  "تحديث جديد من مدينة انواذيبو: هذا منشور اختباري للتحقق من الأداء",
  "Nouvelle mise à jour de Nouadhibou: ceci est un test de performance",
  "مشاركة مجتمعية حول تطوير المدينة والخدمات الأساسية",
  "Partage communautaire sur le développement de la ville",
  "استفسار حول الخدمات البلدية في انواذيبو",
  "Question sur les services municipaux à Nouadhibou",
];

export let options = {
  scenarios: {
    post_creation: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "20s", target: 25 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "post_creation" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<4000", "p(99)<6000"],
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const vuId = __VU - 1;
  const userIndex = vuId + 100; // Use users 100-149
  const email = `222${userIndex < 250 ? "3" : "4"}${String(userIndex).padStart(7, "0")}@phone.indb.local`;

  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) return;

  check(session, { "logged in": (s) => !!s.accessToken });

  const content = CONTENT_TEMPLATES[vuId % CONTENT_TEMPLATES.length];
  const post = {
    author_id: session.userId,
    type: POST_TYPES[vuId % POST_TYPES.length],
    content: `${content} [load-test-${__VU}-${Date.now()}]`,
    status: "published",
  };

  const res = supabasePost(SUPABASE_URL, `posts`, post, session.accessToken, ANON_KEY);
  check(res, {
    "post created": (r) => r.status === 201,
  });

  if (res.status === 201) {
    // Verify the post was created by fetching it back
    const postId = res.json().id || res.json()[0]?.id;
    if (postId) {
      sleep(0.5);
      const verifyRes = supabaseGet(
        SUPABASE_URL,
        `posts?select=id,content&id=eq.${postId}&limit=1`,
        session.accessToken,
        ANON_KEY
      );
      check(verifyRes, { "post verified": (r) => r.status === 200 });
    }
  }

  sleep(2);
}
