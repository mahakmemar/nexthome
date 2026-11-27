import { NextResponse } from "next/server";
import { guardSim } from "@/lib/sim/guard";
import { runDueJobs } from "@/lib/sim/jobs";

// "Run jobs now": runs everything that is due at the simulated time.
export async function POST(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  return NextResponse.json(await runDueJobs());
}
