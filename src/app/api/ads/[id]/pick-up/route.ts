import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isSlotInPast, parseSlots } from "@/lib/slots";
import { BOOKING_LIMIT_MESSAGE, MAX_ACTIVE_BOOKINGS } from "@/lib/bookings";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Log in or sign up to pick this up", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  // The helper must pick exactly one of the time slots the poster offered.
  const body = await req.json().catch(() => ({}));
  const slot: unknown = body?.slot;

  const ad = await db.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.status !== "ACTIVE") {
    return NextResponse.json({ error: "Ad is no longer available" }, { status: 409 });
  }

  const offered = parseSlots(ad.timeSlots);
  if (offered.length > 0) {
    if (typeof slot !== "string" || !offered.includes(slot)) {
      return NextResponse.json(
        { error: "Pick one of the available time slots" },
        { status: 400 },
      );
    }
  }

  if (typeof slot === "string" && isSlotInPast(slot)) {
    return NextResponse.json({ error: "That time slot has already passed" }, { status: 400 });
  }

  // Check the limit and claim in one transaction, so two quick taps (or two tabs)
  // can't slip past the limit, and so an ad can't be booked twice.
  const result = await db.$transaction(async (tx) => {
    const booked = await tx.ad.count({ where: { status: "CLAIMED", claimedById: user.id } });
    if (booked >= MAX_ACTIVE_BOOKINGS) return { error: "LIMIT" as const };

    const claimed = await tx.ad.updateMany({
      where: { id, status: "ACTIVE" },
      data: {
        status: "CLAIMED",
        claimedById: user.id,
        claimedAt: new Date(),
        claimedSlot: typeof slot === "string" ? slot : null,
      },
    });
    if (claimed.count === 0) return { error: "TAKEN" as const };

    const ad = await tx.ad.findUnique({ where: { id }, include: { poster: true, claimedBy: true } });
    return { ad };
  });

  if ("error" in result) {
    return result.error === "LIMIT"
      ? NextResponse.json({ error: BOOKING_LIMIT_MESSAGE, code: "BOOKING_LIMIT" }, { status: 409 })
      : NextResponse.json({ error: "Ad is no longer available" }, { status: 409 });
  }
  const updated = result.ad;

  return NextResponse.json(updated);
}
