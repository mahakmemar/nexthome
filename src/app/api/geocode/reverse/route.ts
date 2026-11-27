import { NextRequest, NextResponse } from "next/server";
import { shortAddress, type NominatimAddress } from "@/lib/geo";
import { nominatim } from "@/lib/nominatim";

type ReverseResult = {
  display_name?: string;
  address?: NominatimAddress & { house_number?: string };
};

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (
    !req.nextUrl.searchParams.get("lat") ||
    !req.nextUrl.searchParams.get("lon") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return NextResponse.json({ error: "lat and lon must be valid coordinates" }, { status: 400 });
  }

  // zoom 18 asks for the nearest building. Rounding to 5 decimals (about 1 m)
  // lets repeated lookups from the same spot share one cached answer.
  const data = await nominatim<ReverseResult>("reverse", {
    lat: lat.toFixed(5),
    lon: lon.toFixed(5),
    zoom: "18",
  });
  if (!data || !data.display_name) {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 });
  }

  return NextResponse.json({
    label: data.display_name,
    address: shortAddress(data.address) ?? data.display_name,
    hasHouseNumber: Boolean(data.address?.house_number),
    latitude: lat,
    longitude: lon,
  });
}
