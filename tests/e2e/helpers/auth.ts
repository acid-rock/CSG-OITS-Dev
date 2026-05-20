import { Page } from "@playwright/test";

export const TEST_ADMIN_EMAIL =
  process.env.TEST_ADMIN_EMAIL || "test@admin.com";
export const TEST_ADMIN_PASSWORD =
  process.env.TEST_ADMIN_PASSWORD || "TestPass1";

/**
 * Logs into the admin panel and waits for the dashboard to load.
 * Call this at the start of any test that requires admin auth.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
  await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 10_000 });
}

/**
 * Logs out of the admin panel.
 */
export async function logout(page: Page): Promise<void> {
  await page.click("text=Log Out");
  await page.waitForURL("**/admin/login**", { timeout: 5_000 });
}
