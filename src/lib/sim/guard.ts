import { NextResponse } from "next/server";
import { isSimulate } from "@/lib/sim/state";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

/**
 * Every /api/sim route calls this first. Returns a response to send back when the
 * request must be refused, or null when it is fine to go ahead.
 */
export function guardSim(req: Request) {
  if (!isSimulate()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const host = (req.headers.get("host") ?? "").replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.includes(host)) {
    return NextResponse.json({ error: "Simulate mode only answers on localhost" }, { status: 403 });
  }
  return null;
}
