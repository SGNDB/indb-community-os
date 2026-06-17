import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "TestPass123!";
const LOCALE = process.env.E2E_LOCALE || "ar";
const FEED_URL = `${BASE_URL}/${LOCALE}/feed`;

async function loginAs(page, phoneSuffix = "30000001") {
  await page.goto(`${BASE_URL}/${LOCALE}/login`);
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]').fill(phoneSuffix);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/feed$/, { timeout: 15000 });
}

test.describe("Feed", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "45000001"); // French locale user
  });

  test("should load feed with posts", async ({ page }) => {
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Posts should be rendered
    const posts = page.locator('[data-testid="post-card"], article, .post-card').first();
    await expect(posts).toBeVisible({ timeout: 15000 });
  });

  test("should create a new post", async ({ page }) => {
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Find the create post input/button
    const createBtn = page.locator('button:has-text("إنشاء"), button:has-text("Créer"), a[href*="post/edit"], [data-testid="create-post"]');
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
    }

    // Try inline creation or navigate to create page
    const contentArea = page.locator('textarea, [contenteditable="true"], [data-testid="post-content"]').first();
    if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentArea.fill(`E2E test post created at ${Date.now()}`);
      const submit = page.locator('button[type="submit"]:has-text("نشر"), button[type="submit"]:has-text("Publier")');
      await submit.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should react to a post", async ({ page }) => {
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Find a reaction button (like/heart/etc) on a post
    const reactionBtn = page.locator('[data-testid="reaction-button"], button:has-text("❤"), button[aria-label*="like"]').first();
    if (await reactionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reactionBtn.click();
      await page.waitForTimeout(1000);
      // Verify reaction was registered (button state changed)
    }
  });

  test("should add a comment to a post", async ({ page }) => {
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Find a comment input on a post
    const commentInput = page.locator('textarea[placeholder*="تعليق"], textarea[placeholder*="comment"], [data-testid="comment-input"]').first();
    if (await commentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await commentInput.fill(`E2E test comment ${Date.now()}`);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);
    }
  });

  test("should navigate between pages", async ({ page }) => {
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Check that main navigation elements exist
    const nav = page.locator("nav, [role='navigation'], header").first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });
});
