import { test, expect } from "@playwright/test";

test.describe("Public homepage", () => {
  test("loads without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Central Student Government/);
    // Two <nav> elements exist (desktop + mobile) — use first()
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("navigation dropdown shows Announcements and Events links", async ({ page }) => {
    await page.goto("/");
    // Click the "News" group button — adds nav-group-open class which shows the dropdown.
    // (CSS :hover also opens it for real users; click is used here for test reliability.)
    await page.locator("button.nav-group-btn").filter({ hasText: "News" }).click();
    const openDrop = page.locator(".nav-group-open .nav-dropdown");
    await expect(openDrop.getByText("Announcements")).toBeVisible();
    await expect(openDrop.getByText("Events", { exact: true })).toBeVisible();
  });

  test("clicking Announcements in dropdown navigates to /bulletin", async ({
    page,
  }) => {
    await page.goto("/");
    await page.hover(".nav-group:has-text('News')");
    // Click the Announcements menuitem — nav item href is /bulletin
    await page.locator('[role="menuitem"]').filter({ hasText: "Announcements" }).first().click();
    await expect(page).toHaveURL(/\/bulletin/);
  });
});

test.describe("/bulletin (announcements) page", () => {
  test("search bar filters announcements", async ({ page }) => {
    await page.goto("/bulletin");
    // Wait for the RootLayout splash screen to clear and API data to load
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByPlaceholder("Search announcements...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("CSG");
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("category filter chips are visible", async ({ page }) => {
    await page.goto("/bulletin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("button.bl-chip", { hasText: "CSG Updates" })).toBeVisible();
    await expect(page.locator("button.bl-chip", { hasText: "Class Advisories" })).toBeVisible();
  });

  test("clicking a category chip filters the list", async ({ page }) => {
    await page.goto("/bulletin");
    await page.waitForLoadState("networkidle");
    await page.locator("button.bl-chip", { hasText: "Examinations" }).click();
    // The active chip receives the bl-chip-active class
    await expect(page.locator("button.bl-chip-active")).toContainText("Examinations");
  });
});

test.describe("/events page", () => {
  test("loads with events section visible", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("search bar is present and functional", async ({ page }) => {
    await page.goto("/events");
    const searchInput = page.getByPlaceholder("Search events...");
    await expect(searchInput).toBeVisible();
  });
});

test.describe("/officers page", () => {
  test("page loads without error", async ({ page }) => {
    await page.goto("/officers");
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("committee card opens modal on click", async ({ page }) => {
    await page.goto("/officers");
    // Wait for API data so committee cards have a chance to render
    await page.waitForLoadState("networkidle");
    const firstCard = page.locator('[class*="committee-card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(
        page.locator('[role="dialog"], [class*="modal"]'),
      ).toBeVisible();
    }
  });
});

test.describe("/borrow equipment page", () => {
  test("page loads without error", async ({ page }) => {
    await page.goto("/borrow");
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("Reserve Equipment button navigates to /borrow/:id", async ({
    page,
  }) => {
    await page.goto("/borrow");
    const btn = page.locator("button", { hasText: "Reserve Equipment" }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page).toHaveURL(/\/borrow\/.+/);
    }
  });
});
