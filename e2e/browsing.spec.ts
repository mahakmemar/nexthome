import { expect, test } from "@playwright/test";
import { loadScenario, pageAs } from "./sim";

test("Home shows active ads, and a buyer's own bookings @desktop", async ({ page, browser, request }, testInfo) => {
  await loadScenario(request, "booked-ads");
  await page.goto("/");
  await expect(page.getByText("Active ads in your area")).toBeVisible();
  await expect(page.getByText("Free desk (open to book)")).toBeVisible();
  // Booked ads are not offered to others.
  await expect(page.getByText("Free bookshelf (dated slot)")).toHaveCount(0);

  const buyer = await pageAs(browser, "buyer", testInfo.project.use.viewport ?? null);
  await buyer.goto("/");
  await expect(buyer.getByText("Ads you have booked to pick up")).toBeVisible();
  await expect(buyer.getByText("Free bookshelf (dated slot)")).toBeVisible();
});

test("searching a place shows only ads near it", async ({ page, request }) => {
  await loadScenario(request, "booked-ads");
  const search = page.getByPlaceholder("Search your area or address");

  await page.goto("/");
  await search.fill("Victoria");
  await page.getByRole("button", { name: /Victoria/ }).first().click();
  await expect(page.getByText("No active ads within 15 km of Victoria.")).toBeVisible();

  await search.fill("Kitsilano");
  await page.getByRole("button", { name: /Kitsilano/ }).first().click();
  await expect(page.getByText("Active ads near Kitsilano")).toBeVisible();
  await expect(page.getByText("Free desk (open to book)")).toBeVisible();
});

test("the Ads page lists only active ads, and an ad page shows its details", async ({ page, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  await page.goto("/ads");
  await expect(page.getByRole("heading", { name: "All active ads" })).toBeVisible();
  await expect(page.getByText("Free desk (open to book)")).toBeVisible();
  await expect(page.getByText("Free lamp (as soon as possible)")).toHaveCount(0);

  await page.goto(`/ads/${ads.open}`);
  await expect(page.getByRole("heading", { name: "Free desk (open to book)" })).toBeVisible();
  await expect(page.getByText("Free", { exact: true })).toBeVisible();
  await expect(page.getByText("800 Robson St, Vancouver, BC")).toBeVisible();
  await expect(page.getByText("GIVE AWAY · FURNITURE", { exact: false }).or(page.getByText(/Give away · Furniture/i))).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();
});
