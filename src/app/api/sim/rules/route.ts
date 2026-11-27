import { NextResponse } from "next/server";
import { guardSim } from "@/lib/sim/guard";
import { resetRules, setRuleOverrides } from "@/lib/sim/state";
import { DEFAULT_RULES, getRules, type Rules } from "@/lib/rules";

// Body: { "maxActiveBookings": 2, "releaseAfterSlotEndsMs": 600000, ... } or { "reset": true }
export async function POST(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Send a JSON body" }, { status: 400 });

  if (body.reset === true) {
    resetRules();
    return NextResponse.json({ rules: getRules() });
  }
  const overrides: Partial<Rules> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!(key in DEFAULT_RULES)) return NextResponse.json({ error: `Unknown rule: ${key}` }, { status: 400 });
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: `${key} must be a number, 0 or more` }, { status: 400 });
    }
    overrides[key as keyof Rules] = value;
  }
  setRuleOverrides(overrides);
  return NextResponse.json({ rules: getRules() });
}
