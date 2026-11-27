import { notFound } from "next/navigation";
import { connection } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getRules } from "@/lib/rules";
import { releaseDueAt } from "@/lib/auto-release";
import { slotLabel } from "@/lib/slots";
import { getClock, isSimulate, simNow } from "@/lib/sim/state";
import { PERSONAS, SCENARIO_DESCRIPTIONS, SCENARIO_NAMES } from "@/lib/sim/scenarios";
import { SimPanel } from "@/components/sim/SimPanel";

// The simulate-mode control panel. Does not exist outside simulate mode.

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];
const pad = (n: number) => String(n).padStart(2, "0");
/** "2026-12-05T09:00", in server local time, for a datetime-local input. */
const localInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const label = (d: Date) =>
  d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function SimPage() {
  // Decide per request, never at build time (when simulate mode is always off).
  await connection();
  if (!isSimulate()) notFound();
  const host = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.includes(host)) notFound();

  const now = simNow();
  const rules = getRules();
  const viewer = await getSessionUser();

  const bookings = await db.ad.findMany({
    where: { status: "CLAIMED" },
    include: { claimedBy: true },
    orderBy: { claimedAt: "asc" },
  });
  const released = await db.rating.findMany({
    where: { source: "SYSTEM" },
    include: { ad: true, ratedUser: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <SimPanel
      clock={getClock()}
      nowMs={now.getTime()}
      nowInput={localInput(now)}
      rules={rules}
      viewer={viewer ? { name: viewer.name, email: viewer.email } : null}
      personas={Object.entries(PERSONAS).map(([key, p]) => ({ key, name: p.name }))}
      scenarios={SCENARIO_NAMES.map((name) => ({ name, description: SCENARIO_DESCRIPTIONS[name] }))}
      bookings={bookings.map((ad) => {
        const due = releaseDueAt(ad, rules);
        return {
          id: ad.id,
          title: ad.title,
          buyer: ad.claimedBy?.name ?? "?",
          slot: ad.claimedSlot ? slotLabel(ad.claimedSlot, now) : "No slot",
          releaseAt: due ? label(due) : "Never",
          releaseInput: due ? localInput(due) : null,
          overdue: Boolean(due && due.getTime() <= now.getTime()),
        };
      })}
      released={released.map((r) => ({
        id: r.id,
        adId: r.adId,
        title: r.ad.title,
        buyer: r.ratedUser.name,
        at: label(r.createdAt),
        corrected: Boolean(r.correctedAt),
      }))}
    />
  );
}
