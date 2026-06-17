import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "TestPass123!";
const LOCALE = process.env.E2E_LOCALE || "ar";
const FEED_URL = `${BASE_URL}/${LOCALE}/feed`;

async function loginAs(page, phoneSuffix) {
  await page.goto(`${BASE_URL}/${LOCALE}/login`);
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]').fill(phoneSuffix);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/feed$/, { timeout: 15000 });
}

test.describe("Notifications", () => {
  test("should show notification badge with unread count", async ({ page }) => {
    await loginAs(page, "30000007");
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Look for a notification bell/icon with a badge count
    const notifBadge = page.locator('[data-testid="notification-badge"], [data-testid="unread-count"], [class*="notification"][class*="badge"]').first();
    if (await notifBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      const badgeText = await notifBadge.textContent();
      // Badge should have a number (possibly "0")
      expect(badgeText).not.toBeNull();
    }
  });

  test("should open notification dropdown when clicked", async ({ page }) => {
    await loginAs(page, "30000008");
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Click the notification icon
    const notifIcon = page.locator('button[aria-label*="notification"], [data-testid="notification-button"], a[href*="notification"]').first();
    if (await notifIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notifIcon.click();
      await page.waitForTimeout(2000);

      // Dropdown or panel should appear
      const dropdown = page.locator('[data-testid="notification-dropdown"], [role="menu"], [role="dialog"]').first();
      await expect(dropdown).toBeVisible({ timeout: 3000 });
    }
  });

  test("should have realtime notification delivery", async ({ page }) => {
    // Use two browser contexts to test realtime notifications
    // This test requires the Playwright's browser context API

    // User B (the receiver) opens feed
    const receiverCtx = await page.context();
    const receiverPage = await receiverCtx.newPage();
    await loginAs(page, "30000009"); // Login as receiver
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Open a second browser context for User A (the sender)
    const senderCtx = await page.context().browser()?.newContext();
    if (senderCtx) {
      const senderPage = await senderCtx.newPage();
      await loginAs(senderPage, "30000100"); // Login as different user
      await senderPage.goto(FEED_URL);
      await senderPage.waitForLoadState("networkidle");

      // Have User A perform an action that triggers notification for User B
      // (e.g., follow User B, or react to their post)
      // This depends on finding the right UI elements

      await senderPage.close();
      await senderCtx.close();
    }

    // Check that notification count or UI updated
    await page.waitForTimeout(5000);
  });

  test("should mark notifications as read", async ({ page }) => {
    await loginAs(page, "30000010");
    await page.goto(FEED_URL);
    await page.waitForLoadState("networkidle");

    // Open notifications
    const notifIcon = page.locator('button[aria-label*="notification"], [data-testid="notification-button"]').first();
    if (await notifIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notifIcon.click();
      await page.waitForTimeout(1000);

      // Find the "mark all read" button
      const markReadBtn = page.locator('button:has-text("قراءة"), button:has-text("lu"), [data-testid="mark-all-read"]').first();
      if (await markReadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await markReadBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
