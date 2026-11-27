import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";

// Helpers for driving simulate mode from tests (see src/app/api/sim/*).

export type Persona = "poster" | "buyer" | "buyer2" | "flaky";
export type Scenario = "empty" | "booked-ads" | "buyer-at-limit" | "flaky-buyer";

const HOUR = 60 * 60 * 1000;
export const hours = (n: number) => n * HOUR;

async function post(request: APIRequestContext, path: string, data: object) {
  const res = await request.post(path, { data });
  expect(res.ok(), `${path} -> ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json();
}

/** Wipe the simulate database, load a scenario and freeze the clock at Sat 5 Dec 2026 09:00. */
export async function loadScenario(request: APIRequestContext, name: Scenario) {
  return (await post(request, "/api/sim/scenario", { name })) as {
    users: Record<Persona, string>;
    ads: Record<string, string>;
  };
}

/** Jump the clock to a local time, e.g. "2026-12-05T12:00". Scheduled jobs then run unless told not to. */
export async function setClock(request: APIRequestContext, to: string, runJobs = true) {
  return post(request, "/api/sim/clock", { set: to, runJobs });
}

export async function setRules(request: APIRequestContext, rules: Record<string, number>) {
  return post(request, "/api/sim/rules", rules);
}

export const BASE_URL = "http://localhost:3000";

/** A separate browser (own cookies) logged in as a persona, on the same screen size as the test. */
export async function pageAs(browser: Browser, persona: Persona, viewport?: { width: number; height: number } | null): Promise<Page> {
  const page = await newPage(browser, viewport);
  await post(page.request, "/api/sim/login-as", { persona });
  return page;
}

/** A separate browser that is not logged in. */
export async function newPage(browser: Browser, viewport?: { width: number; height: number } | null): Promise<Page> {
  const context = await browser.newContext({ baseURL: BASE_URL, ...(viewport ? { viewport } : {}) });
  return context.newPage();
}

/** Every scenario's people can also log in normally with this password. */
export const SIM_PASSWORD = "simulate123";
export const EMAILS = {
  poster: "poster@sim.test",
  buyer: "buyer@sim.test",
  buyer2: "buyer2@sim.test",
  flaky: "flaky@sim.test",
} as const;
