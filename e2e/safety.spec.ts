import { expect, test } from "@playwright/test";
import { loadScenario, pageAs } from "./sim";

test("only the poster can mark an ad completed", async ({ browser, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  const path = `/api/ads/${ads.anytime}/complete`;
  expect((await request.post(path)).status()).toBe(401);
  const buyer = await pageAs(browser, "buyer2");
  expect((await buyer.request.post(path)).status()).toBe(403);
  const poster = await pageAs(browser, "poster");
  expect((await poster.request.post(path)).status()).toBe(200);
});

test("the scheduled-release endpoint is switched off without its secret", async ({ request }) => {
  // The simulate server runs without CRON_SECRET. The normal-mode tests check it with one.
  expect((await request.post("/api/jobs/release-missed")).status()).toBe(404);
});

test("simulate controls only answer on localhost", async ({ request }) => {
  const res = await request.get("/api/sim/state", { headers: { host: "example.com" } });
  expect(res.status()).toBe(403);
});
