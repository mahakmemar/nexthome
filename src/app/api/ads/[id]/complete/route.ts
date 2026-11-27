import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Log in to complete this ad", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }
  const ad = await db.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.posterId !== user.id) {
    return NextResponse.json({ error: "Only the person who posted this ad can complete it" }, { status: 403 });
  }
  if (ad.status !== "CLAIMED") {
    return NextResponse.json({ error: "Ad is not claimed yet" }, { status: 409 });
  }

  const updated = await db.ad.update({
    where: { id },
    data: { status: "COMPLETED" },
    include: { poster: true, claimedBy: true },
  });

  return NextResponse.json(updated);
}
