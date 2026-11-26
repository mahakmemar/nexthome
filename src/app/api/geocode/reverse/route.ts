import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "NextHome-Clone-Dev/1.0 (local learning project)";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({
    label: data.display_name as string | undefined,
    latitude: Number(lat),
    longitude: Number(lon),
  });
}
