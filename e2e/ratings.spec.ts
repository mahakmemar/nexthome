import { expect, test } from "@playwright/test";
import { loadScenario, pageAs, setClock } from "./sim";

// Scenario "booked-ads": Bea booked the bookshelf for Today 10:00-11:00.

test("the poster reports a no-show, and the ad goes back up @desktop", async ({ browser, request }, testInfo) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const viewport = testInfo.project.use.viewport ?? null;
  await setClock(request, "2026-12-05T10:30");
  const poster = await pageAs(browser, "poster", viewport);
  await poster.goto(`/ads/${ads.dated}`);
  const form = poster.getByRole("region", { name: "Rate Bea Buyer's pick-up" });
  await form.getByRole("radio", { name: "Didn't show up" }).click();
  await expect(form.getByText("Your ad will go back up so someone else can book it.")).toBeVisible();
  // No stars are asked for a no-show.
  await expect(form.getByRole("radio", { name: "5 stars" })).toHaveCount(0);
  await form.getByRole("button", { name: "Submit rating" }).click();
  await expect(poster.getByText("is on the way")).toHaveCount(0);

  const buyer = await pageAs(browser, "buyer", viewport);
  await buyer.goto("/account");
  await expect(buyer.getByText("1 pick-up · 0% on time · 1 no-show")).toBeVisible();
});

test("the poster rates a late pick-up with stars and a note", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  await setClock(request, "2026-12-05T10:45");
  const poster = await pageAs(browser, "poster");
  await poster.goto(`/ads/${ads.dated}`);
  await poster.getByRole("radio", { name: "Came late" }).click();
  await poster.getByRole("radio", { name: "2 stars" }).click();
  await poster.getByPlaceholder("Add a note (optional)").fill("40 minutes late, no message.");
  await poster.getByRole("button", { name: "Submit rating" }).click();
  await expect(poster.getByText("You rated Bea Buyer: Came late · ★★")).toBeVisible();

  const buyer = await pageAs(browser, "buyer");
  await buyer.goto("/account");
  await expect(buyer.getByText("2.0 stars · 1 pick-up · 0% on time")).toBeVisible();
});

test("Submit stays off until the rating is complete", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  await setClock(request, "2026-12-05T10:30");
  const poster = await pageAs(browser, "poster");
  await poster.goto(`/ads/${ads.dated}`);
  const submit = poster.getByRole("button", { name: "Submit rating" });
  await expect(submit).toBeDisabled();
  await poster.getByRole("radio", { name: "Came on time" }).click();
  await expect(submit).toBeDisabled();
  await poster.getByRole("radio", { name: "4 stars" }).click();
  await expect(submit).toBeEnabled();
  await poster.getByRole("radio", { name: "Didn't show up" }).click();
  await expect(submit).toBeEnabled();
});

test("other people see neither the buyer's record nor the rating form", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "flaky-buyer");
  await setClock(request, "2026-12-05T10:30");
  const stranger = await pageAs(browser, "buyer");
  await stranger.goto(`/ads/${ads.booked}`);
  await expect(stranger.getByText("Fay Flaky is on the way")).toBeVisible();
  await expect(stranger.getByText(/pick-ups|no-show/)).toHaveCount(0);
  await expect(stranger.getByText("How did the pick-up go")).toHaveCount(0);
});
