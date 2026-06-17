// k6/scenarios/ideas-workflow.js — Scenario E: 50 users using Ideas
import { check, sleep } from "k6";
import { login, supabaseGet, supabasePost } from "../helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

const IDEA_TITLES = [
  "مشروع ثقافي", "مبادرة بيئية", "تطوير التعليم",
  "Projet culturel", "Initiative environnementale", "Développement de l'éducation",
];
const IDEA_STATUSES = ["published", "interested", "discussion", "in_progress"];

export let options = {
  scenarios: {
    ideas_workflow: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "30s", target: 25 },
        { duration: "60s", target: 50 },
        { duration: "30s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "ideas_workflow" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<4000", "p(99)<6000"],
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const vuId = __VU - 1;
  const userIndex = vuId + 250; // Users 250-299
  const email = `222${userIndex < 250 ? "3" : "4"}${String(userIndex).padStart(7, "0")}@phone.indb.local`;

  const session = login(SUPABASE_URL, ANON_KEY, email, TEST_PASSWORD);
  if (!session) return;

  check(session, { "ideas logged in": (s) => !!s.accessToken });

  // 1. Fetch published ideas
  let res = supabaseGet(
    SUPABASE_URL,
    `ideas?select=*,author:profiles!ideas_author_id_fkey(id,username,avatar_url)&order=votes_count.desc&limit=20`,
    session.accessToken,
    ANON_KEY
  );
  check(res, { "ideas loaded": (r) => r.status === 200 });
  sleep(0.5);

  // 2. Get category list
  res = supabaseGet(SUPABASE_URL, `categories?select=id,name_en,name_ar&limit=50`, session.accessToken, ANON_KEY);
  check(res, { "idea categories loaded": (r) => r.status === 200 });
  const categories = res.json();
  const catId = categories && categories.length > 0 ? categories[0].id : 1;
  sleep(0.5);

  // 3. Create a new idea
  const newIdea = {
    author_id: session.userId,
    title: `${IDEA_TITLES[vuId % IDEA_TITLES.length]} [load-test-${__VU}]`,
    description: `This is a test idea created during load testing (VU ${__VU}). Testing performance under concurrent load.`,
    status: "published",
  };
  if (catId) newIdea.category_id = catId;

  res = supabasePost(SUPABASE_URL, `ideas`, newIdea, session.accessToken, ANON_KEY);
  check(res, { "idea created": (r) => r.status === 201 });
  sleep(1);

  // 4. Vote on some existing ideas
  const ideasRes = supabaseGet(
    SUPABASE_URL,
    `ideas?select=id,author_id&limit=10&status=neq.archived`,
    session.accessToken,
    ANON_KEY
  );
  if (ideasRes.status === 200) {
    const ideas = ideasRes.json();
    if (ideas && ideas.length > 0) {
      for (let i = 0; i < Math.min(3, ideas.length); i++) {
        const idea = ideas[i];
        if (idea.author_id !== session.userId) {
          const vote = { idea_id: idea.id, user_id: session.userId };
          res = supabasePost(SUPABASE_URL, `idea_votes`, vote, session.accessToken, ANON_KEY);
          check(res, { "idea voted": (r) => r.status === 201 || r.status === 200 });
        }
      }
    }
  }
  sleep(1);

  // 5. Support some ideas
  if (ideasRes.status === 200) {
    const ideas = ideasRes.json();
    if (ideas && ideas.length > 0) {
      for (let i = 0; i < Math.min(2, ideas.length); i++) {
        const idea = ideas[i];
        if (idea.author_id !== session.userId) {
          const support = { idea_id: idea.id, user_id: session.userId };
          res = supabasePost(SUPABASE_URL, `idea_supporters`, support, session.accessToken, ANON_KEY);
          check(res, { "idea supported": (r) => r.status === 201 || r.status === 200 });
        }
      }
    }
  }
  sleep(1.5);
}
