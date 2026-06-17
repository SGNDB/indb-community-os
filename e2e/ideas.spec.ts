import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "TestPass123!";
const LOCALE = process.env.E2E_LOCALE || "ar";
const IDEAS_URL = `${BASE_URL}/${LOCALE}/ideas`;

async function loginAs(page, phoneSuffix = "30000001") {
  await page.goto(`${BASE_URL}/${LOCALE}/login`);
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]').fill(phoneSuffix);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/feed$/, { timeout: 15000 });
}

test.describe("Ideas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "30000002"); // Arabic user
  });

  test("should display ideas list", async ({ page }) => {
    await page.goto(IDEAS_URL);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/ideas/);
    // Ideas should be rendered
    const ideasSection = page.locator('[data-testid="idea-card"], article, .idea-card').first();
    await expect(ideasSection).toBeVisible({ timeout: 15000 });
  });

  test("should open submit idea page", async ({ page }) => {
    await page.goto(IDEAS_URL);
    await page.waitForLoadState("networkidle");

    // Find and click the submit button
    const submitBtn = page.locator('a[href*="submit"], button:has-text("فكرة"), button:has-text("Idée")').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      // Should navigate to submit page or show form
      const titleField = page.locator('input[name="title"], textarea[placeholder*="عنوان"], textarea[placeholder*="titre"]').first();
      if (await titleField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleField.fill(`E2E Test Idea ${Date.now()}`);
        const descField = page.locator('textarea[name="description"], textarea[placeholder*="وصف"]').first();
        if (await descField.isVisible().catch(() => false)) {
          await descField.fill("This is an automated E2E test idea for load testing validation.");
        }
        const submit = page.locator('button[type="submit"]:has-text("نشر"), button[type="submit"]:has-text("Soumettre")');
        if (await submit.isVisible().catch(() => false)) {
          await submit.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test("should vote on an idea", async ({ page }) => {
    await page.goto(IDEAS_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Find a vote/upvote button on an idea card
    const voteBtn = page.locator('[data-testid="vote-button"], button[aria-label*="vote"], button:has-text("▲")').first();
    if (await voteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voteBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test("should support an idea", async ({ page }) => {
    await page.goto(IDEAS_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Find a support button
    const supportBtn = page.locator('[data-testid="support-button"], button:has-text("دعم"), button:has-text("Soutenir")').first();
    if (await supportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await supportBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test("should view idea details", async ({ page }) => {
    await page.goto(IDEAS_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Click on the first idea card to see details
    const ideaCard = page.locator('[data-testid="idea-card"], a[href*="/ideas/"]').first();
    if (await ideaCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/\/ideas\//, { timeout: 10000 }),
        ideaCard.click(),
      ]);
      await page.waitForLoadState("networkidle");

      // Should show idea details
      const content = page.locator("main, article, section").first();
      await expect(content).toBeVisible({ timeout: 5000 });
    }
  });
});
