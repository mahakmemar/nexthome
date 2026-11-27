import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPickupStarted, ratingSchema } from "@/lib/rating-rules";

// The poster says how the pick-up went. This also closes the ad:
//   on time / late  -> the ad is COMPLETED
//   no-show         -> the booking is released and the ad goes back to ACTIVE,
//                      so the poster can offer the item to someone else
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Log in to rate this pick-up", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const ad = await db.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.posterId !== user.id) {
    return NextResponse.json({ error: "Only the person who posted this ad can rate the pick-up" }, { status: 403 });
  }
  if (ad.status === "COMPLETED") {
    return NextResponse.json({ error: "You've already rated this pick-up" }, { status: 409 });
  }
  if (ad.status !== "CLAIMED" || !ad.claimedById) {
    return NextResponse.json({ error: "Nobody has booked this ad" }, { status: 409 });
  }
  if (ad.claimedById === user.id) {
    return NextResponse.json({ error: "You can't rate yourself" }, { status: 403 });
  }
  if (!hasPickupStarted(ad.claimedSlot)) {
    return NextResponse.json(
      { error: "You can rate the pick-up once the booked time has started" },
      { status: 409 },
    );
  }

  const parsed = ratingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid rating" },
      { status: 400 },
    );
  }
  const { outcome, stars, comment } = parsed.data;
  const buyerId = ad.claimedById;

  try {
    await db.$transaction(async (tx) => {
      // Match on status and buyer too, so a double click or a cancel at the same
      // moment can't rate a booking that has since changed.
      const changed = await tx.ad.updateMany({
        where: { id, status: "CLAIMED", claimedById: buyerId },
        data:
          outcome === "NO_SHOW"
            ? { status: "ACTIVE", claimedById: null, claimedAt: null, claimedSlot: null }
            : { status: "COMPLETED" },
      });
      if (changed.count === 0) throw new Error("CHANGED");

      await tx.rating.create({
        data: {
          adId: id,
          raterId: user.id,
          ratedUserId: buyerId,
          outcome,
          stars: outcome === "NO_SHOW" ? null : (stars ?? null),
          comment: comment || null,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CHANGED") {
      return NextResponse.json({ error: "This booking has already changed" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, outcome, adStatus: outcome === "NO_SHOW" ? "ACTIVE" : "COMPLETED" });
}
