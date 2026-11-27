import { expect, test } from "@playwright/test";

// These run against the app in NORMAL mode (no SIMULATE), the way it is deployed.

test("simulate mode can't be reached in the normal app", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByTestId("sim-banner")).toHaveCount(0);
  expect((await request.get("/sim")).status()).toBe(404);
  expect((await request.get("/api/sim/state")).status()).toBe(404);
  for (const path of ["/api/sim/clock", "/api/sim/scenario", "/api/sim/login-as", "/api/sim/rules", "/api/sim/jobs"]) {
    expect((await request.post(path, { data: {} })).status(), path).toBe(404);
  }
});

test("the scheduled-release endpoint needs the right secret", async ({ request }) => {
  const path = "/api/jobs/release-missed";
  expect((await request.post(path)).status()).toBe(401);
  expect((await request.post(path, { headers: { "x-cron-secret": "wrong" } })).status()).toBe(401);
  const ok = await request.post(path, { headers: { "x-cron-secret": "e2e-cron-secret" } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toEqual({ released: [] });
});

test("the normal app's main pages load", async ({ page }) => {
  for (const path of ["/", "/ads", "/login", "/signup", "/post", "/my-ads", "/account"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
  }
});
