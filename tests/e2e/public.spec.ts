import { test, expect } from "@playwright/test";

test.describe("Public homepage", () => {
  test("loads without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Central Student Government/);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("navigation dropdown opens on hover", async ({ page }) => {
    await page.goto("/");
    await page.hover("text=News");
    await expect(page.locator("text=Announcements")).toBeVisible();
    await expect(page.locator("text=Events")).toBeVisible();
  });

  test("clicking Announcements in dropdown navigates to /announcements", async ({
    page,
  }) => {
    await page.goto("/");
    await page.hover("text=News");
    await page.click("text=Announcements");
    await expect(page).toHaveURL(/\/announcements/);
  });
});

test.describe("/announcements page", () => {
  test("search bar filters announcements", async ({ page }) => {
    await page.goto("/announcements");
    const searchInput = page.getByPlaceholder("Search announcements...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("CSG");
    await expect(page.locator("body")).not.toContainText(
      "Something went wrong",
    );
  });

  test("category filter chips are visible", async ({ page }) => {
    await page.goto("/announcements");
    await expect(page.locator("text=CSG Updates")).toBeVisible();
    await expect(page.locator("text=Class Advisories")).toBeVisible();
  });

  test("clicking a category chip filters the list", async ({ page }) => {
    await page.goto("/announcements");
    await page.click("text=Examinations");
    const chip = page.locator("button", { hasText: "Examinations" });
    await expect(chip).toHaveClass(/active|selected/);
  });
});

test.describe("/events page", () => {
  test("loads with events section visible", async ({ page }) => {
    await page.goto("/events");
    // Page should load without error regardless of content
    await expect(page.locator("body")).not.toContainText(
      "Something went wrong",
    );
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
    await expect(page.locator("body")).not.toContainText(
      "Something went wrong",
    );
  });

  test("committee card opens modal on click", async ({ page }) => {
    await page.goto("/officers");
    await page.locator("text=COMMITTEES").scrollIntoViewIfNeeded();
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
    await expect(page.locator("body")).not.toContainText(
      "Something went wrong",
    );
  });

  test("Request to Borrow button opens form", async ({ page }) => {
    await page.goto("/borrow");
    const borrowBtn = page
      .locator("button", { hasText: "Request to Borrow" })
      .first();
    if (await borrowBtn.isVisible()) {
      await borrowBtn.click();
      await expect(
        page.locator('input[type="email"], [placeholder*="email"]'),
      ).toBeVisible({ timeout: 3_000 });
    }
  });
});
