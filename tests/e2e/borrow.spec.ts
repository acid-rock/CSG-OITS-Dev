/**
 * E2E tests for the BorrowReservation page (/borrow/:id).
 *
 * All API calls are intercepted with Playwright route mocks so no real
 * database or running backend is required for these tests.
 *
 * Test dates: uses the same next-month-5th / 12th anchoring strategy as the
 * component tests — always 1 "Next ›" click away from today's month.
 */

import { test, expect, Page } from "@playwright/test";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_EQUIPMENT = {
  id: "equip-e2e",
  name: "E2E Projector",
  quantity: 3,
  max_quantity: 5,
  is_available: true,
};

// Conflict: next-month 8th is fully booked (5 of 5)
const today = new Date();
const nmYear =
  today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
const nmMonth = (today.getMonth() + 1) % 12; // 0-based
const mm = String(nmMonth + 1).padStart(2, "0");

const BORROW_DATE = `${nmYear}-${mm}-05`;
const CONFLICT_DATE = `${nmYear}-${mm}-08`;
const RETURN_DATE = `${nmYear}-${mm}-12`;

const MOCK_AVAIL_EMPTY: never[] = [];
const MOCK_AVAIL_CONFLICT = [
  {
    borrow_date: CONFLICT_DATE,
    return_date: CONFLICT_DATE,
    status: "approved",
    quantity_requested: 5,
  },
];

// ── Route interception helper ─────────────────────────────────────────────────

async function mockBorrowRoutes(
  page: Page,
  avail: object[] = MOCK_AVAIL_EMPTY,
) {
  await page.route("**/api/v1/borrowing/inventory/**", (route) =>
    route.fulfill({ json: MOCK_EQUIPMENT }),
  );
  await page.route("**/api/v1/borrowing/availability/**", (route) =>
    route.fulfill({ json: avail }),
  );
  await page.route("**/api/v1/borrowing/request", (route) =>
    route.fulfill({ json: { message: "ok", email_sent: false } }),
  );
}

// ── Navigation helper ─────────────────────────────────────────────────────────

async function gotoReservation(page: Page, avail = MOCK_AVAIL_EMPTY) {
  await mockBorrowRoutes(page, avail);
  await page.goto("/borrow/equip-e2e");
  // Wait for equipment name to confirm page loaded
  await expect(page.getByText("E2E Projector")).toBeVisible({ timeout: 10_000 });
  // Advance calendar to next month
  await page.getByRole("button", { name: /next month/i }).click();
}

// ── Calendar tile helpers ─────────────────────────────────────────────────────

function borrowTile(page: Page) {
  return page.getByRole("button", {
    name: (n) => n.includes(`${BORROW_DATE} — available`),
  });
}

function returnTile(page: Page) {
  return page.getByRole("button", {
    name: (n) => n.includes(`${RETURN_DATE} — available`),
  });
}

// ── TC-E1: Page load ──────────────────────────────────────────────────────────

test.describe("TC-E1: Page load", () => {
  test("equipment name is visible on load", async ({ page }) => {
    await gotoReservation(page);
    await expect(page.getByText("E2E Projector")).toBeVisible();
  });

  test("Step 2 panel is NOT visible on initial load", async ({ page }) => {
    await gotoReservation(page);
    await expect(page.getByText(/Step 2/i)).not.toBeVisible();
  });

  test("Step 3 form is NOT visible on initial load", async ({ page }) => {
    await gotoReservation(page);
    await expect(page.getByText(/Step 3/i)).not.toBeVisible();
  });
});

// ── TC-E2: Borrow date selection ──────────────────────────────────────────────

test.describe("TC-E2: Borrow date selection", () => {
  test("clicking an available date shows the time slot panel", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await expect(page.getByText(/Step 2/i)).toBeVisible();
  });

  test("confirm bar appears with Borrow: label after clicking a date", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await expect(page.getByText(/Borrow:/i)).toBeVisible();
  });
});

// ── TC-E3: Time slot selection ────────────────────────────────────────────────

test.describe("TC-E3: Time slot selection", () => {
  test("Morning card becomes selected after clicking it", async ({ page }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    // Find and click the Morning slot card
    const panel = page.locator(".br-timeslot-panel");
    await panel.getByText("Morning").click();
    // Selected card gets br-slot-card--selected class
    await expect(
      panel.locator(".br-slot-card--selected"),
    ).toContainText("Morning");
  });

  test('"Same-day return allowed" note is visible on AM card', async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await expect(page.getByText(/same-day return allowed/i).first()).toBeVisible();
  });
});

// ── TC-E4: Same-day return (AM) ───────────────────────────────────────────────

test.describe("TC-E4: Same-day return (AM)", () => {
  test("clicking borrow date again after AM shows Step 3 form", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await borrowTile(page).click(); // same-day rangeEnd
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test("confirm bar shows Return: label for same-day range", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await borrowTile(page).click();
    await expect(page.getByText(/Return:/i)).toBeVisible({ timeout: 5_000 });
  });
});

// ── TC-E5: Evening — same-day blocked ────────────────────────────────────────

test.describe("TC-E5: Evening — same-day blocked", () => {
  test("clicking borrow date again after Evening clears the selection", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await borrowTile(page).click(); // should CLEAR, not set rangeEnd
    await expect(page.getByText(/Step 2/i)).not.toBeVisible({ timeout: 3_000 });
  });

  test("Step 3 is NOT visible after attempted Evening same-day click", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await borrowTile(page).click();
    await expect(page.getByText(/Step 3/i)).not.toBeVisible();
  });
});

// ── TC-E6: Multi-day range ────────────────────────────────────────────────────

test.describe("TC-E6: Multi-day range", () => {
  test("Step 3 appears after borrow date + Morning + a later return date", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test("confirm bar shows both Borrow and Return labels for multi-day range", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click();
    await expect(page.getByText(/Borrow:/i)).toBeVisible();
    await expect(page.getByText(/Return:/i)).toBeVisible();
  });
});

// ── TC-E7: Clear button ───────────────────────────────────────────────────────

test.describe("TC-E7: Clear button", () => {
  test("clicking × removes the confirm bar and time slot panel", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await expect(page.getByText(/Step 2/i)).toBeVisible();
    await page.getByRole("button", { name: /clear selection/i }).click();
    await expect(page.getByText(/Step 2/i)).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByText(/Borrow:/i)).not.toBeVisible();
  });

  test("clicking × removes the form when it was visible", async ({ page }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await borrowTile(page).click(); // same-day range
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /clear selection/i }).click();
    await expect(page.getByText(/Step 3/i)).not.toBeVisible({ timeout: 3_000 });
  });
});

// ── TC-E8: Form validation ────────────────────────────────────────────────────

test.describe("TC-E8: Form validation", () => {
  test("submit button is disabled when privacy consent is unchecked", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: /submit reservation/i }),
    ).toBeDisabled();
  });

  test("shows required-fields error when name and student number are empty", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    // Check consent without filling required fields
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(/fill in all required fields/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ── TC-E9: Range conflict warning ────────────────────────────────────────────

test.describe("TC-E9: Range conflict", () => {
  test("shows range warning when a fully booked date falls inside the range", async ({
    page,
  }) => {
    await gotoReservation(page, MOCK_AVAIL_CONFLICT);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click(); // range 5th–12th includes fully-booked 8th
    await expect(
      page.getByText(/Some dates in this range are fully booked/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("submit shows conflict error and does NOT call the API", async ({
    page,
  }) => {
    let apiCalled = false;
    await mockBorrowRoutes(page, MOCK_AVAIL_CONFLICT);
    page.on("request", (req) => {
      if (req.url().includes("/borrowing/request") && req.method() === "POST") {
        apiCalled = true;
      }
    });
    await page.goto("/borrow/equip-e2e");
    await expect(page.getByText("E2E Projector")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /next month/i }).click();

    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.getByText(/fully booked dates/i)).toBeVisible({
      timeout: 5_000,
    });
    expect(apiCalled).toBe(false);
  });
});

// ── TC-E10: Happy path ────────────────────────────────────────────────────────

test.describe("TC-E10: Happy path — full reservation flow", () => {
  test("successfully submits a reservation and shows success screen", async ({
    page,
  }) => {
    await gotoReservation(page);
    // Step 1: Pick borrow date
    await borrowTile(page).click();
    // Step 2: Pick time slot
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    // Step 3a: Pick return date (multi-day)
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    // Step 3b: Fill form
    await page.getByLabel(/full name/i).fill("Juan dela Cruz");
    await page.getByLabel(/student number/i).fill("2021-00001");
    await page.getByLabel(/email/i).fill("juan@example.com");
    await page.getByLabel(/purpose/i).fill("Thesis presentation");
    // Step 3c: Accept consent
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    // Step 3d: Submit
    await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
    // Expect success screen
    await expect(page.getByText(/Reservation submitted/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
