import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { currentTime } from "@/lib/now";
import { getRules } from "@/lib/rules";
import { ratingSchema } from "@/lib/rating-rules";

// The poster fixes a no-show the system recorded: "they actually came".
// The rating becomes a normal poster rating (on time or late, with stars). If nobody else has
// booked the ad since, it is also marked completed. If someone has, their booking is left alone.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const rating = await db.rating.findUnique({ where: { id }, include: { ad: true } });
  if (!rating) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rating.ad.posterId !== user.id) {
    return NextResponse.json({ error: "Only the person who posted this ad can change this" }, { status: 403 });
  }
  if (rating.source !== "SYSTEM" || rating.correctedAt) {
    return NextResponse.json({ error: "This rating can't be changed" }, { status: 409 });
  }
  const now = currentTime();
  if (now.getTime() - rating.createdAt.getTime() > getRules().undoWindowMs) {
    return NextResponse.json({ error: "The time to correct this has passed" }, { status: 409 });
  }

  const parsed = ratingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid rating" }, { status: 400 });
  }
  if (parsed.data.outcome === "NO_SHOW") {
    return NextResponse.json({ error: "Choose on time or late, or leave it as it is" }, { status: 400 });
  }
  const { outcome, stars, comment } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const changed = await tx.rating.updateMany({
      where: { id, source: "SYSTEM", correctedAt: null },
      data: { outcome, stars: stars ?? null, comment: comment || null, source: "POSTER", correctedAt: now },
    });
    if (changed.count === 0) return null;
    const completed = await tx.ad.updateMany({
      where: { id: rating.adId, status: "ACTIVE", claimedById: null },
      data: { status: "COMPLETED" },
    });
    return { adCompleted: completed.count > 0 };
  });
  if (!result) return NextResponse.json({ error: "This rating was already changed" }, { status: 409 });

  return NextResponse.json({ ok: true, outcome, ...result });
}
