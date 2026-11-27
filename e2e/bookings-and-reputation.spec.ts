import { expect, test } from "@playwright/test";
import { loadScenario, pageAs, setRules } from "./sim";

test("a buyer at the booking limit can't book another ad until the limit allows it", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "buyer-at-limit");
  const buyer = await pageAs(browser, "buyer");

  await buyer.goto(`/ads/${ads.open}`);
  await expect(buyer.getByText("You've reached the limit of 5 booked ads.")).toBeVisible();
  await expect(buyer.getByRole("button", { name: "PICK UP" })).toBeDisabled();

  await setRules(request, { maxActiveBookings: 6 });
  await buyer.reload();
  await buyer.getByRole("button", { name: "PICK UP" }).click();
  await expect(buyer.getByText("You have booked to pick up this item at any time.")).toBeVisible();
});

test("the poster sees a flaky buyer's record on their booking", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "flaky-buyer");
  const poster = await pageAs(browser, "poster");
  await poster.goto(`/ads/${ads.booked}`);
  await expect(poster.getByText("Fay Flaky is on the way")).toBeVisible();
  await expect(poster.getByText("4.3 stars · 6 pick-ups · 33% on time · 3 no-shows")).toBeVisible();
});

test("only the poster can rate a pick-up", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const body = { data: { outcome: "ON_TIME", stars: 5 } };
  for (const persona of ["buyer", "buyer2"] as const) {
    const page = await pageAs(browser, persona);
    expect((await page.request.post(`/api/ads/${ads.anytime}/rate`, body)).status()).toBe(403);
  }
  expect((await request.post(`/api/ads/${ads.anytime}/rate`, body)).status()).toBe(401);
});
