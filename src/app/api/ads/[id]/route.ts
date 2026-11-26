import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ad = await db.ad.findUnique({
    where: { id },
    include: { poster: true, claimedBy: true },
  });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ad);
}
