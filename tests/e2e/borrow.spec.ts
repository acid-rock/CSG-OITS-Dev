/**
 * E2E tests for the BorrowReservation page (/borrow/:id).
 *
 * All API calls are intercepted with Playwright route mocks so no real
 * database or running backend is required for these tests.
 *
 * Test dates are anchored at today+2 / today+5 so they always fall within the
 * component's 7-day booking window (today+7 max). Dates outside the window
 * render as 'past' and the calendar tile is disabled — the regex that looks
 * for 'available' in the aria-label would never match.
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

// BorrowReservation enforces a 7-day booking window: dates beyond today+7
// render as 'past' (disabled) in the calendar.  Anchor all test dates within
// that window so the tiles have aria-label "YYYY-MM-DD — available".
function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const BORROW_DATE   = addDays(2); // today + 2
const CONFLICT_DATE = addDays(3); // today + 3 — falls inside BORROW..RETURN range
const RETURN_DATE   = addDays(5); // today + 5

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
  // ── Catch-all: MUST be registered FIRST ──────────────────────────────────
  // Playwright checks routes LAST-registered first, so this catch-all is
  // checked LAST and only fires for routes not matched by the specific mocks
  // below.  This intercepts all real backend calls from RootLayout (bulletin,
  // documents, events, settings, etc.) so the tests never hit the rate limiter
  // regardless of how many runs have been executed.
  await page.route("**/api/v1/**", (route) => {
    const url = route.request().url();
    // Return a minimal valid response for the settings/access_paused check
    if (url.includes("/settings/")) {
      route.fulfill({ status: 200, json: { key: "access_paused", value: "false" } });
    } else {
      route.fulfill({ status: 200, json: [] });
    }
  });

  // ── Specific mocks (registered LAST = checked FIRST) ─────────────────────
  // Access control — always grant a slot so QueueScreen never shows
  await page.route("**/api/v1/access/join", (route) =>
    route.fulfill({ json: { allowed: true, token: "e2e-test-token" } }),
  );
  await page.route("**/api/v1/access/heartbeat", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  // Borrow-specific endpoints
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

// ── Calendar month helper ─────────────────────────────────────────────────────

// Returns "YYYY-MM" for the current month.
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// ── Navigation helper ─────────────────────────────────────────────────────────

async function gotoReservation(page: Page, avail = MOCK_AVAIL_EMPTY) {
  await mockBorrowRoutes(page, avail);
  await page.goto("/borrow/equip-e2e");
  // Wait for the RootLayout splash screen to clear (all public API calls finish),
  // then the BorrowReservation component mounts and fires its mocked API calls.
  await page.waitForLoadState("networkidle");
  // Confirm the mock intercepted the inventory call and returned mock equipment
  await expect(page.getByText("E2E Projector")).toBeVisible({ timeout: 10_000 });
  // Advance calendar one month only when BORROW_DATE is in the next calendar month
  // (rare — only happens when today is in the last 2 days of the month)
  if (BORROW_DATE.slice(0, 7) !== currentMonth()) {
    await page.getByRole("button", { name: /next month/i }).click();
  }
}

// ── Calendar tile helpers ─────────────────────────────────────────────────────

// borrowTile — first click only (tile status is still 'available')
function borrowTile(page: Page) {
  // Use regex — Playwright cannot serialize arrow-function predicates as selectors
  return page.getByRole("button", {
    name: new RegExp(`${BORROW_DATE}.*available`, "i"),
  });
}

// borrowTileAny — second click on the same borrow date.
// After the first click the aria-label changes to "…range-start" (no longer
// "…available"), so we match the date prefix only.
function borrowTileAny(page: Page) {
  return page.locator(`button[aria-label^="${BORROW_DATE}"]`);
}

function returnTile(page: Page) {
  return page.getByRole("button", {
    name: new RegExp(`${RETURN_DATE}.*available`, "i"),
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
// The component auto-sets rangeEnd = rangeStart via useEffect when AM/PM is
// selected — no additional tile click is needed.

test.describe("TC-E4: Same-day return (AM)", () => {
  test("selecting AM auto-advances to Step 3 form (same-day range)", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    // Selecting Morning triggers a useEffect: rangeEnd auto-set = rangeStart → Step 3 appears
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test("confirm bar shows Return: label after selecting AM (same-day)", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
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
    // Tile is now 'range-start', use borrowTileAny — click should CLEAR (no same-day for PM)
    await borrowTileAny(page).click();
    await expect(page.getByText(/Step 2/i)).not.toBeVisible({ timeout: 3_000 });
  });

  test("Step 3 is NOT visible after attempted Evening same-day click", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await borrowTileAny(page).click();
    await expect(page.getByText(/Step 3/i)).not.toBeVisible();
  });
});

// ── TC-E6: Multi-day range ────────────────────────────────────────────────────
// AM/PM auto-set same-day rangeEnd, so clicking a later return date would reset
// the selection. Use Evening (sameDayReturn=false) for multi-day range tests.

test.describe("TC-E6: Multi-day range", () => {
  test("Step 3 appears after borrow date + Evening + a later return date", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    // Evening does NOT auto-set same-day return, so returnTile click sets rangeEnd correctly
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test("confirm bar shows both Borrow and Return labels for multi-day range", async ({
    page,
  }) => {
    await gotoReservation(page);
    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
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
    // Morning auto-sets same-day rangeEnd → Step 3 appears immediately
    await page.locator(".br-timeslot-panel").getByText("Morning").click();
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
    // Evening → no same-day auto; returnTile sets the multi-day rangeEnd correctly
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
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
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    // Check consent without filling required fields — then trigger React's onSubmit.
    // Use dispatchEvent instead of requestSubmit so browser HTML5 validation does NOT
    // intercept; React's own guard ('Please fill in all required fields.') runs instead.
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    await page.locator("form").evaluate((f: HTMLFormElement) =>
      f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await expect(page.getByText(/fill in all required fields/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ── TC-E9: Range conflict warning ────────────────────────────────────────────
// CONFLICT_DATE (today+3) is fully booked. Range = BORROW_DATE–RETURN_DATE spans it.
// Must use Evening so returnTile properly sets multi-day rangeEnd (AM/PM auto-sets
// same-day and a subsequent tile click would reset the selection).

test.describe("TC-E9: Range conflict", () => {
  test("shows range warning when a fully booked date falls inside the range", async ({
    page,
  }) => {
    await gotoReservation(page, MOCK_AVAIL_CONFLICT);
    await borrowTile(page).click();
    // Evening: no same-day auto; returnTile click sets rangeEnd = RETURN_DATE
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await returnTile(page).click(); // BORROW_DATE..RETURN_DATE spans CONFLICT_DATE
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
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("E2E Projector")).toBeVisible({ timeout: 10_000 });
    // Advance calendar if BORROW_DATE is in the next calendar month
    if (BORROW_DATE.slice(0, 7) !== currentMonth()) {
      await page.getByRole("button", { name: /next month/i }).click();
    }

    await borrowTile(page).click();
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    // Use dispatchEvent to bypass browser HTML5 validation — React's conflict guard
    // runs first and sets the error before reaching the required-fields check.
    await page.locator("form").evaluate((f: HTMLFormElement) =>
      f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
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
    // Step 2: Pick time slot — use Evening so returnTile sets multi-day rangeEnd correctly
    // (AM/PM auto-set same-day via useEffect; clicking returnTile after that would reset)
    await page.locator(".br-timeslot-panel").getByText("Evening").click();
    // Step 3a: Pick return date (multi-day)
    await returnTile(page).click();
    await expect(page.getByText(/Step 3/i)).toBeVisible({ timeout: 5_000 });
    // Step 3b: Fill form — inputs use placeholder, no htmlFor/id associations.
    // Use exact:true for "Full name" because "Type your full name as signature"
    // also contains "Full name" as a substring (Playwright does partial matching).
    await page.getByPlaceholder("Full name", { exact: true }).fill("Juan dela Cruz");
    await page.getByPlaceholder(/2021-00123/).fill("2021-00001");
    await page.getByPlaceholder(/cvsu\.edu\.ph/).fill("juan@example.com");
    // Signature (React validates this field before submitting)
    await page.getByPlaceholder(/Type your full name as signature/).fill("Juan dela Cruz");
    // Step 3c: Accept consent
    await page.getByRole("checkbox", { name: /voluntarily authorize/i }).check();
    // Step 3d: Submit — all required HTML fields filled so requestSubmit works
    await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
    // Expect success screen
    await expect(page.getByText(/Reservation submitted/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
