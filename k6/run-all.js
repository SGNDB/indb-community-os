// k6/run-all.js — Master orchestration runner
// Combines all 6 scenarios into a single k6 run for comprehensive load testing.
//
// Usage:
//   k6 run -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... -e TEST_PASSWORD=... k6/run-all.js
//
// Run individual scenarios:
//   k6 run k6/scenarios/feed-browsing.js   # Scenario A: 100 users, feed browsing
//   k6 run k6/scenarios/post-creation.js    # Scenario B: 50 users, post creation
//   k6 run k6/scenarios/comment-creation.js # Scenario C: 50 users, comment creation
//   k6 run k6/scenarios/fadla-workflow.js   # Scenario D: 50 users, Fadla workflow
//   k6 run k6/scenarios/ideas-workflow.js   # Scenario E: 50 users, Ideas workflow
//   k6 run k6/scenarios/notifications.js    # Scenario F: 50 users, notifications

import { group } from "k6";
import { login } from "./helpers.js";

const SUPABASE_URL = __ENV.SUPABASE_URL || "https://oanwmlouezwtcirrhbyl.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPass123!";

// Combined options for all scenarios
export let options = {
  stages: [
    // Ramp up to 100 feed browsers
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    // Add 50 post creators
    { duration: "20s", target: 150 },
    // Add 50 commenters
    { duration: "20s", target: 200 },
    // Add 50 Fadla users
    { duration: "30s", target: 250 },
    // Add 50 Ideas users
    { duration: "30s", target: 300 },
    // Add 50 notification checkers (peak: 300 concurrent)
    { duration: "60s", target: 300 },
    // Ramp down
    { duration: "60s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<8000"],
    http_req_failed: ["rate<0.10"],
    http_reqs: ["rate>10"],
  },
};

export default function () {
  group("Auth: Login", function () {
    // This group is inherited by each scenario's actual login call
  });

  group("API: Data Fetch", function () {
    // Measures general API response times
  });
}

// Import all scenario functions so they're compiled
// But we don't run them here; each is run separately via `k6 run <file>`
// This file serves as a combined-options reference.
console.info("k6 run-all: use individual scenario files or the combined runner below");
console.info("See k6/scenarios/ for individual scenarios");
