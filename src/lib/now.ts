// The app's clock. In normal use this is just the real time.
//
// In simulate mode (SIMULATE=1, see src/lib/sim/state.ts) time can be moved and slowed
// down so tests and manual checks can play out "the buyer never came" scenarios.
// This file has no server-only code, so server and browser code can both import it:
//   - on the server, src/instrumentation.ts registers __SIM_NOW (reads the shared state file)
//   - in the browser, the root layout injects __SIM_CLOCK before the page loads
// Use currentTime() instead of new Date() / Date.now() for anything that depends on "now".

export type SimClock = {
  /** Real time (ms) when the simulated time was last set. */
  anchorReal: number;
  /** Simulated time (ms) at that moment. */
  anchorSim: number;
  /** 1 = real speed, 0 = frozen, 60 = a minute passes every second. */
  speed: number;
};

type SimGlobals = { __SIM_NOW?: () => Date; __SIM_CLOCK?: SimClock };

export function simTimeFor(clock: SimClock, realMs = Date.now()) {
  return clock.anchorSim + (realMs - clock.anchorReal) * clock.speed;
}

export function currentTime(): Date {
  const g = globalThis as SimGlobals;
  if (g.__SIM_NOW) return g.__SIM_NOW();
  if (g.__SIM_CLOCK) return new Date(simTimeFor(g.__SIM_CLOCK));
  return new Date();
}

export function currentMs(): number {
  return currentTime().getTime();
}
