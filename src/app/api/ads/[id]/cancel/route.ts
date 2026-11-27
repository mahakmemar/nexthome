import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// A helper gives up their booked spot. The ad goes back to ACTIVE with its time
// slots available again, so someone else can book it.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Log in to cancel your spot", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const ad = await db.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.status !== "CLAIMED") {
    return NextResponse.json({ error: "This ad isn't booked" }, { status: 409 });
  }
  if (ad.claimedById !== user.id) {
    return NextResponse.json({ error: "Only the helper who booked can cancel" }, { status: 403 });
  }

  // Match on status and claimer too, so a double click or a concurrent change
  // can't release a booking that has since changed.
  const released = await db.ad.updateMany({
    where: { id, status: "CLAIMED", claimedById: user.id },
    data: { status: "ACTIVE", claimedById: null, claimedAt: null, claimedSlot: null },
  });
  if (released.count === 0) {
    return NextResponse.json({ error: "This booking has already changed" }, { status: 409 });
  }

  const updated = await db.ad.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
