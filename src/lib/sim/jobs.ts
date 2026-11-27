import { releaseMissedPickups } from "@/lib/auto-release";

// Everything that would normally run on a schedule. Simulate mode runs it after each clock
// change and on "Run jobs now", so a test can move time and immediately see the effect.
export async function runDueJobs() {
  const { released } = await releaseMissedPickups();
  return { releasedMissedPickups: released };
}
