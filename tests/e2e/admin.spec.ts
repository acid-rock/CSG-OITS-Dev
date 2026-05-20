import { test, expect } from "@playwright/test";

// Admin panel smoke tests — verify UI renders correctly after login.
// These do NOT perform write operations that would mutate the database.

test.describe("Admin panel navigation", () => {
  test.skip("can navigate between panels via sidebar", async ({ page }) => {
    // Requires auth — skip unless TEST_ADMIN_EMAIL is set and loginAsAdmin is called.
    // Switch panel via ?panel= URL param and verify heading changes.
    await page.goto("/admin?panel=announcements");
    await expect(
      page.locator("h1, h2", { hasText: "Announcement" }),
    ).toBeVisible();

    await page.goto("/admin?panel=documents");
    await expect(page.locator("h1, h2", { hasText: "Document" })).toBeVisible();

    await page.goto("/admin?panel=officers");
    await expect(page.locator("h1, h2", { hasText: "Officer" })).toBeVisible();
  });
});
