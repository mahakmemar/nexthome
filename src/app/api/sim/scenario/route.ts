import { NextResponse } from "next/server";
import { guardSim } from "@/lib/sim/guard";
import { SCENARIO_NAMES, loadScenario } from "@/lib/sim/scenarios";

// Body: { "name": "booked-ads" }. Wipes the simulate database, loads the scenario, sets the clock.
export async function POST(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  if (!body?.name || !SCENARIO_NAMES.includes(body.name as (typeof SCENARIO_NAMES)[number])) {
    return NextResponse.json({ error: `Unknown scenario. Choose one of: ${SCENARIO_NAMES.join(", ")}` }, { status: 400 });
  }
  return NextResponse.json(await loadScenario(body.name as (typeof SCENARIO_NAMES)[number]));
}
