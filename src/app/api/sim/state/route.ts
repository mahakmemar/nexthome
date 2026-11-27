import { NextResponse } from "next/server";
import { guardSim } from "@/lib/sim/guard";
import { getClock, simNow } from "@/lib/sim/state";
import { getRules } from "@/lib/rules";
import { SCENARIO_NAMES, PERSONAS } from "@/lib/sim/scenarios";

export async function GET(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  return NextResponse.json({
    now: simNow().toISOString(),
    clock: getClock(),
    rules: getRules(),
    database: process.env.DATABASE_URL,
    scenarios: SCENARIO_NAMES,
    personas: Object.keys(PERSONAS),
  });
}
