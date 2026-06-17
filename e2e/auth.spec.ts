import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "TestPass123!";
const LOCALE = process.env.E2E_LOCALE || "ar";
const LOGIN_URL = `${BASE_URL}/${LOCALE}/login`;
const FEED_URL = `${BASE_URL}/${LOCALE}/feed`;
const REGISTER_URL = `${BASE_URL}/${LOCALE}/register`;

// Use seed data: user index 1 (test user)
const TEST_PHONE = "22230000001";
const TEST_EMAIL = `${TEST_PHONE}@phone.indb.local`;
const TEST_USERNAME = "user_0001";

test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page).toHaveURL(/\/login$/);
    // Should show a phone input field
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");

    // Fill phone and password
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]');
    await phoneInput.fill("30000001");

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Should redirect to feed after successful login
    await page.waitForURL(/\/feed$/, { timeout: 15000 });
    await expect(page).toHaveURL(FEED_URL);
  });

  test("should show error with wrong password", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");

    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]');
    await phoneInput.fill("30000001");

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("WrongPassword999!");

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Should show error message, not redirect
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain("/feed");
    // Error should be visible somewhere
    const errorMsg = page.locator("text=خطأ").or(page.locator('[role="alert"]'));
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test("should show registration page", async ({ page }) => {
    await page.goto(REGISTER_URL);
    await expect(page).toHaveURL(/\/register$/);
    // Should have name + phone + password fields
    await expect(page.locator('input[name="fullName"], input[placeholder*="الاسم"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("should redirect authenticated user to feed", async ({ page }) => {
    // First login
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="222"]').fill("30000001");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/feed$/, { timeout: 15000 });

    // Now try to visit login page — should redirect back to feed
    await page.goto(LOGIN_URL);
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/feed");
  });
});
