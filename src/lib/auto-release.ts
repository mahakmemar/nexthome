import { db } from "@/lib/db";
import { currentTime } from "@/lib/now";
import { getRules, type Rules } from "@/lib/rules";
import { parseDatedSlot } from "@/lib/slots";

// A booking the poster never confirmed is released automatically once the pick-up time has
// clearly passed. The item goes back up for others, and the buyer gets a no-show recorded by
// the system (the poster can correct it for a while: "they actually came").
//
//   dated slot            -> release after the slot ENDS plus a grace period (default 1 hour)
//   "as soon as possible" -> release 24 hours after booking
//   "anytime" / older     -> release 72 hours after booking
// All of the timings live in src/lib/rules.ts, where simulate mode can override them.

type Booking = { claimedAt: Date | null; claimedSlot: string | null };

/** When this booking becomes due for release, or null if it never does. */
export function releaseDueAt(booking: Booking, rules: Rules): Date | null {
  const dated = booking.claimedSlot ? parseDatedSlot(booking.claimedSlot) : null;
  if (dated) {
    // A slot ending at 00 ends at midnight: hour 24 rolls over to the next day.
    const end = new Date(dated.y, dated.mo - 1, dated.d, dated.startHour + 1, 0);
    return new Date(end.getTime() + rules.releaseAfterSlotEndsMs);
  }
  if (!booking.claimedAt) return null;
  const after = booking.claimedSlot === "asap" ? rules.releaseAsapAfterMs : rules.releaseAnytimeAfterMs;
  return new Date(booking.claimedAt.getTime() + after);
}

/**
 * Release every booking whose time is up. Safe to run as often as you like, from several places
 * at once: each release only happens if the ad is still booked by the same person, and it is
 * decided in one database transaction together with the no-show record.
 */
export async function releaseMissedPickups(now: Date = currentTime()) {
  const rules = getRules();
  const booked = await db.ad.findMany({
    where: { status: "CLAIMED", claimedById: { not: null } },
    select: { id: true, posterId: true, claimedById: true, claimedAt: true, claimedSlot: true },
  });

  const released: string[] = [];
  for (const ad of booked) {
    const due = releaseDueAt(ad, rules);
    if (!due || due.getTime() > now.getTime() || !ad.claimedById) continue;
    const buyerId = ad.claimedById;

    await db.$transaction(async (tx) => {
      const changed = await tx.ad.updateMany({
        // Still booked by the same person, and not rated or cancelled in the meantime.
        where: { id: ad.id, status: "CLAIMED", claimedById: buyerId },
        data: { status: "ACTIVE", claimedById: null, claimedAt: null, claimedSlot: null },
      });
      if (changed.count === 0) return;
      await tx.rating.create({
        data: {
          adId: ad.id,
          raterId: ad.posterId,
          ratedUserId: buyerId,
          outcome: "NO_SHOW",
          source: "SYSTEM",
          createdAt: now,
        },
      });
      released.push(ad.id);
    });
  }
  return { released };
}
