// k6/scenarios/comment-creation.js — Scenario C: 50 users creating comments
import { check, sleep } from "k6";
import { login, supabaseGet, supabasePost } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

const COMMENTS = [
  "رائع! شكراً على المشاركة",
  "محتوى قيم جداً، نتمنى المزيد",
  "Excellent! Merci pour le partage",
  "Très intéressant, continuez comme ça",
  "الله يرحم الزمن الجميل",
  "Que Dieu bénisse ce travail",
  "فكرة ممتازة ونتمنى تطبيقها على أرض الواقع",
  "Une excellente initiative",
];

export let options = {
  scenarios: {
    comment_creation: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "20s", target: 25 },
        { duration: "60s", target: 50 },
        { duration: "20s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "comment_creation" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<4000", "p(99)<6000"],
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const vuId = __VU - 1;
  const userIndex = vuId + 150; // Use users 150-199
  const email = `222${userIndex < 250 ? "3" : "4"}${String(userIndex).padStart(7, "0")}@phone.indb.local`;

  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) return;

  check(session, { "logged in": (s) => !!s.accessToken });

  // Fetch recent posts to comment on
  const postsRes = supabaseGet(
    SUPABASE_URL,
    `posts?select=id,author_id&status=eq.published&order=created_at.desc&limit=10`,
    session.accessToken,
    ANON_KEY
  );
  check(postsRes, { "posts fetched for comment": (r) => r.status === 200 });
  if (postsRes.status !== 200) { sleep(3); return; }

  const posts = postsRes.json();
  if (!posts || posts.length === 0) { sleep(3); return; }

  const targetPost = posts[vuId % posts.length];
  const comment = {
    post_id: targetPost.id,
    author_id: session.userId,
    content: `${COMMENTS[vuId % COMMENTS.length]} [load-test-${__VU}]`,
    status: "published",
  };

  const res = supabasePost(SUPABASE_URL, `comments`, comment, session.accessToken, ANON_KEY);
  check(res, {
    "comment created": (r) => r.status === 201,
  });

  // Also read the post's existing comments
  sleep(0.5);
  const commentsRes = supabaseGet(
    SUPABASE_URL,
    `comments?select=id,content,author:profiles!comments_author_id_fkey(username,avatar_url)&post_id=eq.${targetPost.id}&order=created_at.desc&limit=5`,
    session.accessToken,
    ANON_KEY
  );
  check(commentsRes, { "comments read": (r) => r.status === 200 });

  sleep(2);
}
