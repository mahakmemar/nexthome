import { NextResponse } from "next/server";
import { guardSim } from "@/lib/sim/guard";
import { advance, getClock, resetClock, setSpeed, setTime, simNow } from "@/lib/sim/state";
import { runDueJobs } from "@/lib/sim/jobs";

// Body, one of:
//   { "set": "2026-12-05T10:30:00" }   jump to a moment (no zone = server local time)
//   { "advanceMs": 3600000 }            move forward (or back with a negative number)
//   { "speed": 60 }                     0 = frozen, 1 = real speed, 60 = a minute per second
//   { "reset": true }                   back to the real clock
// After any change the scheduled jobs run once for the new time (add "runJobs": false to skip).
export async function POST(req: Request) {
  const refused = guardSim(req);
  if (refused) return refused;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Send a JSON body" }, { status: 400 });

  if (body.reset === true) resetClock();
  else if (typeof body.set === "string") {
    const to = new Date(body.set);
    if (Number.isNaN(to.getTime())) return NextResponse.json({ error: "Unreadable date" }, { status: 400 });
    setTime(to);
  } else if (typeof body.advanceMs === "number" && Number.isFinite(body.advanceMs)) advance(body.advanceMs);
  else if (typeof body.speed === "number" && body.speed >= 0 && Number.isFinite(body.speed)) setSpeed(body.speed);
  else return NextResponse.json({ error: "Send set, advanceMs, speed or reset" }, { status: 400 });

  const jobs = body.runJobs === false ? null : await runDueJobs();
  return NextResponse.json({ now: simNow().toISOString(), clock: getClock(), jobs });
}
