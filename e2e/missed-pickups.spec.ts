import { expect, test } from "@playwright/test";
import { loadScenario, pageAs, setClock, setRules } from "./sim";

// Scenario "booked-ads" starts frozen at Sat 5 Dec 2026 09:00:
//   dated   - Bea booked the 10:00-11:00 slot   -> released at 12:00 if nobody rates it
//   asap    - Ben booked "as soon as possible"  -> released 24h after booking
//   anytime - Ben booked "anytime"              -> released 72h after booking

test("a dated booking nobody confirmed is released 1 hour after the slot ends", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  const buyer = await pageAs(browser, "buyer");

  await poster.goto(`/ads/${ads.dated}`);
  await expect(poster.getByText("You can rate the pick-up once the booked time has started.")).toBeVisible();

  // One minute before the release time: still booked.
  await setClock(request, "2026-12-05T11:59");
  await poster.reload();
  await expect(poster.getByText("Bea Buyer is on the way")).toBeVisible();

  // Release time.
  const { jobs } = await setClock(request, "2026-12-05T12:00");
  expect(jobs.releasedMissedPickups).toEqual([ads.dated]);

  await poster.reload();
  await expect(poster.getByText("Did they actually come?")).toBeVisible();
  await expect(poster.getByText("is on the way")).toHaveCount(0);

  await buyer.goto("/account");
  await expect(buyer.getByRole("status")).toContainText("was released because the time passed");
  await expect(buyer.getByText("1 pick-up · 0% on time · 1 no-show")).toBeVisible();
});

test("a booking the poster already rated is never released", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  const buyer = await pageAs(browser, "buyer");

  await setClock(request, "2026-12-05T10:30");
  await poster.goto(`/ads/${ads.dated}`);
  await poster.getByRole("radio", { name: "Came on time" }).click();
  await poster.getByRole("radio", { name: "5 stars" }).click();
  await poster.getByRole("button", { name: "Submit rating" }).click();
  await expect(poster.getByText("You rated Bea Buyer: Came on time · ★★★★★")).toBeVisible();

  const { jobs } = await setClock(request, "2026-12-07T12:00");
  expect(jobs.releasedMissedPickups).not.toContain(ads.dated);

  await buyer.goto("/account");
  await expect(buyer.getByText("5.0 stars · 1 pick-up · 100% on time")).toBeVisible();
  await expect(buyer.getByRole("status")).toHaveCount(0);
});

test("the poster can correct an automatic no-show to 'they came'", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  const buyer = await pageAs(browser, "buyer");
  await setClock(request, "2026-12-05T12:00");

  await poster.goto(`/ads/${ads.dated}`);
  // Correcting offers on time / late only.
  await expect(poster.getByRole("radio", { name: "Didn't show up" })).toHaveCount(0);
  await poster.getByRole("radio", { name: "Came late" }).click();
  await poster.getByRole("radio", { name: "3 stars" }).click();
  await poster.getByRole("button", { name: "Yes, they came" }).click();

  await expect(poster.getByText("This task has been completed.")).toBeVisible();
  await expect(poster.getByText("Did they actually come?")).toHaveCount(0);

  await buyer.goto("/account");
  await expect(buyer.getByText("3.0 stars · 1 pick-up · 0% on time")).toBeVisible();
  await expect(buyer.getByText("no-show")).toHaveCount(0);
  await expect(buyer.getByRole("status")).toHaveCount(0);
});

test("the correction window closes after 48 hours", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  await setClock(request, "2026-12-05T12:00");

  await setClock(request, "2026-12-07T11:59");
  await poster.goto(`/ads/${ads.dated}`);
  await expect(poster.getByText("Did they actually come?")).toBeVisible();

  await setClock(request, "2026-12-07T12:01");
  await poster.reload();
  await expect(poster.getByText("Did they actually come?")).toHaveCount(0);
});

test("'as soon as possible' and 'anytime' bookings are released after 24h and 72h", async ({ request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  expect((await setClock(request, "2026-12-06T08:59")).jobs.releasedMissedPickups).toEqual([ads.dated]);
  expect((await setClock(request, "2026-12-06T09:00")).jobs.releasedMissedPickups).toEqual([ads.asap]);
  expect((await setClock(request, "2026-12-08T08:59")).jobs.releasedMissedPickups).toEqual([]);
  expect((await setClock(request, "2026-12-08T09:00")).jobs.releasedMissedPickups).toEqual([ads.anytime]);
});

test("a released ad can be booked by someone else, and a late correction leaves that booking alone", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  const buyer = await pageAs(browser, "buyer");
  await setClock(request, "2026-12-06T09:00"); // releases Ben's "as soon as possible" booking

  await buyer.goto(`/ads/${ads.asap}`);
  await buyer.getByRole("button", { name: "PICK UP" }).click();
  await expect(buyer.getByText("You have booked to pick up this item as soon as possible.")).toBeVisible();

  // The poster now sees two separate forms: rate Bea's new booking, and correct Ben's old no-show.
  await poster.goto(`/ads/${ads.asap}`);
  await expect(poster.getByRole("region", { name: "Rate Bea Buyer's pick-up" })).toBeVisible();
  const correction = poster.getByRole("region", { name: "Correct Ben Second's missed pick-up" });
  await correction.getByRole("radio", { name: "Came on time" }).click();
  await correction.getByRole("radio", { name: "4 stars" }).click();
  await correction.getByRole("button", { name: "Yes, they came" }).click();

  // Ben's record is fixed, and the ad stays with Bea.
  await expect(correction).toHaveCount(0);
  await expect(poster.getByText("Bea Buyer is on the way")).toBeVisible();
  const ben = await pageAs(browser, "buyer2");
  await ben.goto("/account");
  await expect(ben.getByText("4.0 stars · 1 pick-up · 100% on time")).toBeVisible();
});

test("rating and auto-release at the same moment: exactly one wins", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const poster = await pageAs(browser, "poster");
  await setClock(request, "2026-12-05T12:00", false); // due, but the job has not run yet

  const [rate] = await Promise.all([
    poster.request.post(`/api/ads/${ads.dated}/rate`, { data: { outcome: "ON_TIME", stars: 5 } }),
    request.post("/api/sim/jobs"),
  ]);

  const buyer = await pageAs(browser, "buyer");
  await buyer.goto("/account");
  // Whoever won, Bea has exactly one rating for this booking, and it matches the winner.
  if (rate.ok()) {
    await expect(buyer.getByText("5.0 stars · 1 pick-up · 100% on time")).toBeVisible();
  } else {
    expect(rate.status()).toBe(409);
    await expect(buyer.getByText("1 pick-up · 0% on time · 1 no-show")).toBeVisible();
  }
  await expect(buyer.getByText(/\b[2-9] pick-ups\b/)).toHaveCount(0);
});

test("release timing follows the rules simulate mode sets", async ({ request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  await setRules(request, { releaseAfterSlotEndsMs: 10 * 60 * 1000 }); // 10 minutes instead of 1 hour
  expect((await setClock(request, "2026-12-05T11:09")).jobs.releasedMissedPickups).toEqual([]);
  expect((await setClock(request, "2026-12-05T11:10")).jobs.releasedMissedPickups).toEqual([ads.dated]);
});
