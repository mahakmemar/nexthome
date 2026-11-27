import { expect, test } from "@playwright/test";

// The /sim control panel, used the way a person would.
test("the control panel loads a scenario, logs in, moves the clock and releases a missed pick-up", async ({ page, request }) => {
  await page.goto("/sim");
  await expect(page.getByRole("heading", { name: "Simulate controls" })).toBeVisible();

  // Load a scenario (it asks first, because it wipes the simulate database).
  page.once("dialog", (d) => d.accept());
  await page.getByLabel("Choose a scenario").selectOption("booked-ads");
  await expect(page.getByText("Bea booked a 10:00-11:00 slot")).toBeVisible();
  await page.getByRole("button", { name: "Load scenario" }).click();
  await expect(page.getByTestId("sim-message")).toContainText('Loaded "booked-ads"');

  const clock = page.getByTestId("sim-time");
  await expect(clock).toContainText("5 Dec 2026");
  await expect(clock).toContainText("09:00:00");
  await expect(page.getByText("Frozen", { exact: true })).toBeVisible();

  const bookings = page.getByRole("region", { name: "Bookings" });
  await expect(bookings.getByRole("link", { name: "Free bookshelf (dated slot)" })).toBeVisible();
  await expect(bookings.getByText("Auto-release: Sat 5 Dec, 12:00")).toBeVisible();

  // Log in as a persona.
  await page.getByRole("button", { name: "Pat Poster" }).click();
  await expect(page.getByTestId("sim-viewer")).toHaveText("Logged in as Pat Poster (poster@sim.test)");

  // Step the clock forward.
  await page.getByRole("button", { name: "+1 hour" }).click();
  await expect(clock).toContainText("10:00:00");
  await expect(page.getByTestId("sim-message")).toContainText("Nothing was due for release.");

  // Jump straight to the bookshelf's release time: it is released and listed as a no-show.
  await bookings.locator("li", { hasText: "Free bookshelf (dated slot)" }).getByRole("button", { name: "Jump to release time" }).click();
  await expect(page.getByTestId("sim-message")).toContainText("Released 1 missed pick-up.");
  await expect(clock).toContainText("12:00:00");
  await expect(bookings.getByText(/Free bookshelf \(dated slot\) · Bea Buyer · .* · counted as no-show/)).toBeVisible();

  // The yellow bar on every page leads back here.
  await page.goto("/");
  await page.getByTestId("sim-banner").click();
  await expect(page).toHaveURL(/\/sim$/);

  // Rules can be changed and reset.
  const limit = page.getByLabel("Booking limit per person");
  await limit.fill("2");
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(page.getByTestId("sim-message")).toHaveText("Rules saved.");
  expect((await (await request.get("/api/sim/state")).json()).rules.maxActiveBookings).toBe(2);
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect(limit).toHaveValue("5");
});

test("bad input in the panel shows an error instead of saving", async ({ page }) => {
  await page.goto("/sim");
  await page.getByLabel("Booking limit per person").fill("lots");
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(page.getByTestId("sim-message")).toHaveText("Booking limit per person: enter a number, 0 or more");
});

// The production build used to pre-render some pages at build time (when simulate mode is off),
// so they missed the simulated clock. The post wizard's time slots depend on it.
test("every page gets the simulated clock, including the post wizard", async ({ page, request }) => {
  await request.post("/api/sim/scenario", { data: { name: "empty" } });
  for (const path of ["/post", "/sim", "/login", "/"]) {
    await page.goto(path);
    await expect(page.getByTestId("sim-banner"), path).toContainText("5 Dec 2026, 09:00");
    const simulated = await page.evaluate(() => (window as unknown as { __SIM_CLOCK?: { anchorSim: number } }).__SIM_CLOCK?.anchorSim);
    expect(simulated, path).toBe(new Date(2026, 11, 5, 9, 0).getTime());
  }
});
