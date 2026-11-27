import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSelfUser } from "@/lib/user";
import { getSessionUser } from "@/lib/session";
import { validateOfferedSlots } from "@/lib/slots";
import { validatePhotoUrls } from "@/lib/uploads";

export async function GET() {
  const ads = await db.ad.findMany({
    orderBy: { createdAt: "desc" },
    include: { poster: true, claimedBy: true },
  });
  return NextResponse.json(ads);
}

// A coordinate is stored only if it is a real number in range.
function toCoordinate(value: unknown, limit: number) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit
    ? value
    : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1 to 5 valid time slots (or a single "asap"/"anytime"), checked server-side
  // so the limit can't be bypassed by calling the API directly.
  const slots = validateOfferedSlots(body.timeSlots);
  if (!slots.ok) {
    return NextResponse.json({ error: slots.error }, { status: 400 });
  }

  // 1 to 5 photos, and only ones uploaded through /api/uploads (never another site's URL).
  const photos = await validatePhotoUrls(body.photos);
  if (!photos.ok) {
    return NextResponse.json({ error: photos.error }, { status: 400 });
  }

  // The ad belongs to the account that is logged in, so that account can later rate
  // whoever books it. Without a login it falls back to the shared "You" user, as before.
  const poster = (await getSessionUser()) ?? (await getSelfUser());
  const price = Number(body.price);

  const ad = await db.ad.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory ?? null,
      size: body.size,
      photos: JSON.stringify(photos.photos),
      address: body.address,
      latitude: toCoordinate(body.latitude, 90),
      longitude: toCoordinate(body.longitude, 180),
      placement: body.placement ?? null,
      floor: body.floor ?? null,
      doorCode: body.doorCode ?? null,
      fitsInElevator: Boolean(body.fitsInElevator),
      canHelpCarry: Boolean(body.canHelpCarry),
      timeSlots: JSON.stringify(slots.slots),
      price,
      // There is no service fee. The columns stay, so the total is simply the price.
      serviceFee: 0,
      total: price,
      posterId: poster.id,
    },
  });

  return NextResponse.json(ad, { status: 201 });
}
