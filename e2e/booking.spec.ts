import { expect, test } from "@playwright/test";
import { loadScenario, newPage, pageAs, setClock } from "./sim";

// Scenario "booked-ads": the open desk offers Today 14:00-15:00 and Tomorrow 10:00-11:00.

test("a buyer picks a time and books; the poster sees who is coming @desktop", async ({ browser, request }, testInfo) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const viewport = testInfo.project.use.viewport ?? null;
  const buyer = await pageAs(browser, "buyer", viewport);
  await buyer.goto(`/ads/${ads.open}`);
  await expect(buyer.getByRole("button", { name: "PICK UP" })).toBeDisabled();
  await expect(buyer.getByText("Select a time slot to enable PICK UP.")).toBeVisible();
  await buyer.getByRole("radio", { name: "14:00–15:00" }).click();
  await buyer.getByRole("button", { name: "PICK UP" }).click();
  await expect(buyer.getByText("You have booked Today 14:00–15:00 to pick up this item.")).toBeVisible();

  const poster = await pageAs(browser, "poster", viewport);
  await poster.goto(`/ads/${ads.open}`);
  await expect(poster.getByText("Bea Buyer is on the way")).toBeVisible();
  await expect(poster.getByText("Time: Today 14:00–15:00")).toBeVisible();
});

test("picking up while logged out asks you to log in or sign up", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const visitor = await newPage(browser);
  await visitor.goto(`/ads/${ads.open}`);
  await visitor.getByRole("radio", { name: "14:00–15:00" }).click();
  await visitor.getByRole("button", { name: "PICK UP" }).click();
  const prompt = visitor.getByRole("alert").filter({ hasText: "Log in or sign up to pick this up" });
  await expect(prompt.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(prompt.getByRole("link", { name: "Sign up" })).toBeVisible();
});

test("times that have passed can't be booked", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const buyer = await pageAs(browser, "buyer");

  await setClock(request, "2026-12-05T15:00"); // today's 14:00-15:00 is over
  await buyer.goto(`/ads/${ads.open}`);
  await expect(buyer.getByRole("radio", { name: "14:00–15:00" })).toHaveCount(0);
  await expect(buyer.getByRole("radio", { name: "10:00–11:00" })).toBeVisible();

  await setClock(request, "2026-12-06T11:00"); // every offered time is over
  await buyer.reload();
  await expect(buyer.getByText("The time slots for this ad have passed.")).toBeVisible();
  await expect(buyer.getByRole("button", { name: "PICK UP" })).toBeDisabled();
});

test("two buyers booking the same ad at once: exactly one gets it", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const url = `/ads/${ads.open}?slot=${encodeURIComponent("2026-12-05@14-15")}`;
  const bea = await pageAs(browser, "buyer");
  const ben = await pageAs(browser, "buyer2");
  await Promise.all([bea.goto(url), ben.goto(url)]);

  await Promise.all([
    bea.getByRole("button", { name: "PICK UP" }).click(),
    ben.getByRole("button", { name: "PICK UP" }).click(),
  ]);
  await Promise.all([bea.reload(), ben.reload()]);

  const won = await Promise.all([bea, ben].map((p) => p.getByText("You have booked Today 14:00–15:00").count()));
  expect(won.reduce((a, b) => a + b, 0)).toBe(1);
  const loser = won[0] ? ben : bea;
  await expect(loser.getByText(/is on the way/)).toBeVisible();
});

test("cancelling a booking asks first, then puts the ad back up", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const buyer = await pageAs(browser, "buyer");
  await buyer.goto(`/ads/${ads.open}`);
  await buyer.getByRole("radio", { name: "14:00–15:00" }).click();
  await buyer.getByRole("button", { name: "PICK UP" }).click();

  await buyer.getByRole("button", { name: "Cancel my spot" }).click();
  await buyer.getByRole("button", { name: "Keep my spot" }).click();
  await expect(buyer.getByText("You have booked Today 14:00–15:00")).toBeVisible();

  await buyer.getByRole("button", { name: "Cancel my spot" }).click();
  await buyer.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(buyer.getByRole("radio", { name: "14:00–15:00" })).toBeVisible();
  await expect(buyer.getByRole("button", { name: "PICK UP" })).toBeVisible();
});
