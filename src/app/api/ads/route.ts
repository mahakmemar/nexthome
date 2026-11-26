import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSelfUser } from "@/lib/user";
import { calcServiceFee } from "@/lib/types";

export async function GET() {
  const ads = await db.ad.findMany({
    orderBy: { createdAt: "desc" },
    include: { poster: true, claimedBy: true },
  });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const self = await getSelfUser();
  const price = Number(body.price);
  const serviceFee = calcServiceFee(price);

  const ad = await db.ad.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory ?? null,
      size: body.size,
      photos: JSON.stringify(body.photos ?? []),
      address: body.address,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      placement: body.placement ?? null,
      floor: body.floor ?? null,
      doorCode: body.doorCode ?? null,
      fitsInElevator: Boolean(body.fitsInElevator),
      canHelpCarry: Boolean(body.canHelpCarry),
      timeSlots: JSON.stringify(body.timeSlots ?? []),
      price,
      serviceFee,
      total: price + serviceFee,
      posterId: self.id,
    },
  });

  return NextResponse.json(ad, { status: 201 });
}
