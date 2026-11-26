import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSelfUser } from "@/lib/user";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const self = await getSelfUser();

  const ad = await db.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.status !== "ACTIVE") {
    return NextResponse.json({ error: "Ad is no longer available" }, { status: 409 });
  }

  const updated = await db.ad.update({
    where: { id },
    data: { status: "CLAIMED", claimedById: self.id, claimedAt: new Date() },
    include: { poster: true, claimedBy: true },
  });

  return NextResponse.json(updated);
}
