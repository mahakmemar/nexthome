import { NextResponse } from "next/server";
import { releaseMissedPickups } from "@/lib/auto-release";

// For a real scheduler (a cron service calling this every few minutes). It is switched off
// unless CRON_SECRET is set, and the caller must send it in the x-cron-secret header.
// The app also releases bookings whenever it shows ads, so this only makes it happen on time.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await releaseMissedPickups());
}
