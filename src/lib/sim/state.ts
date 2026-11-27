// Simulate mode (runs on port 3000, in place of the normal app): a local-only mode for playing out scenarios (see package.json "dev:simulate").
// It lets you move the clock, change business rules, switch users and load scenarios.
//
// State lives in a small JSON file (.sim/state.json) rather than in memory, because Next.js can
// run route handlers and pages in separate module instances that must all agree on the time.
//
// Server-only (uses the file system). Never import this from a client component.

import fs from "node:fs";
import path from "node:path";
import { simTimeFor, type SimClock } from "@/lib/now";
import type { Rules } from "@/lib/rules";

export type SimState = { clock: SimClock | null; rules: Partial<Rules> };

export function isSimulate() {
  return process.env.SIMULATE === "1";
}

/**
 * Simulate mode wipes data and moves time, so it must never touch the real database.
 * Refuse to start unless the database file is clearly a simulate one.
 */
export function assertSimulateIsSafe() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("simulate")) {
    throw new Error(
      `SIMULATE=1 needs a separate database, but DATABASE_URL is "${url || "(not set)"}". ` +
        `Use "npm run dev:simulate", which sets DATABASE_URL=file:./simulate.db.`,
    );
  }
}

const FILE = path.join(process.cwd(), ".sim", "state.json");
const EMPTY: SimState = { clock: null, rules: {} };

let cache: { mtimeMs: number; state: SimState } | null = null;

export function readState(): SimState {
  try {
    const { mtimeMs } = fs.statSync(FILE);
    if (cache && cache.mtimeMs === mtimeMs) return cache.state;
    const state = { ...EMPTY, ...(JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<SimState>) };
    cache = { mtimeMs, state };
    return state;
  } catch {
    return EMPTY;
  }
}

export function writeState(state: SimState) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE); // atomic, so a reader never sees half a file
  cache = null;
}

// ---------- the clock ----------

/** The simulated time (or the real time if the clock has not been touched). */
export function simNow(): Date {
  const { clock } = readState();
  return clock ? new Date(simTimeFor(clock)) : new Date();
}

export function getClock(): SimClock | null {
  return readState().clock;
}

/** Jump to a moment. Keeps the current speed (default: real speed). */
export function setTime(to: Date) {
  const state = readState();
  writeState({
    ...state,
    clock: { anchorReal: Date.now(), anchorSim: to.getTime(), speed: state.clock?.speed ?? 1 },
  });
}

export function advance(ms: number) {
  setTime(new Date(simNow().getTime() + ms));
}

/** 1 = real speed, 0 = frozen, 60 = one simulated minute per real second. */
export function setSpeed(speed: number) {
  const state = readState();
  writeState({ ...state, clock: { anchorReal: Date.now(), anchorSim: simNow().getTime(), speed } });
}

export function resetClock() {
  writeState({ ...readState(), clock: null });
}

// ---------- business rule overrides ----------

export function setRuleOverrides(overrides: Partial<Rules>) {
  const state = readState();
  writeState({ ...state, rules: { ...state.rules, ...overrides } });
}

export function resetRules() {
  writeState({ ...readState(), rules: {} });
}
