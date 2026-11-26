import { NextRequest, NextResponse } from "next/server";
import { haversineDistanceKm } from "@/lib/geo";

const NOMINATIM_USER_AGENT = "NextHome-Clone-Dev/1.0 (local learning project)";

// Half-width of the biasing viewbox around the user, in degrees (~55km at the equator).
const BIAS_BOX_DEGREES = 0.5;

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const hasOrigin = Number.isFinite(lat) && Number.isFinite(lon) && req.nextUrl.searchParams.has("lat");

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");

  if (hasOrigin) {
    // Bias (not restrict) results toward a box around the user's current location.
    url.searchParams.set(
      "viewbox",
      [
        lon - BIAS_BOX_DEGREES,
        lat + BIAS_BOX_DEGREES,
        lon + BIAS_BOX_DEGREES,
        lat - BIAS_BOX_DEGREES,
      ].join(","),
    );
    url.searchParams.set("bounded", "0");
  }

  const res = await fetch(url, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data: NominatimResult[] = await res.json();
  let results = data.map((item) => ({
    label: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    distanceKm: hasOrigin
      ? haversineDistanceKm(lat, lon, Number(item.lat), Number(item.lon))
      : null,
  }));

  if (hasOrigin) {
    results = results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  return NextResponse.json({ results: results.slice(0, 5) });
}
