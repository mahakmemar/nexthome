// Node.js-only startup work, loaded from instrumentation.ts. Kept in its own file so the Edge
// build of instrumentation.ts never sees Node-only APIs such as process.exit.
import { assertSimulateIsSafe, simNow } from "@/lib/sim/state";

if (process.env.SIMULATE === "1") {
  try {
    assertSimulateIsSafe();
  } catch (e) {
    // Stop the server outright rather than serve errors: simulate mode must never run on real data.
    console.error(`[simulate] ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
  // From here on, currentTime() on the server returns the simulated time.
  (globalThis as { __SIM_NOW?: () => Date }).__SIM_NOW = simNow;
  console.log("[simulate] SIMULATE=1: separate database, clock and rules can be changed via /api/sim/*");
}
