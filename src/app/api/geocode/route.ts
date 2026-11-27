import { NextRequest, NextResponse } from "next/server";
import {
  extractHouseNumber,
  haversineDistanceKm,
  shortAddress,
  type NominatimAddress,
} from "@/lib/geo";
import { nominatim } from "@/lib/nominatim";
import { bcGeocode, inBritishColumbia } from "@/lib/bcgeocoder";

// Half-width of the biasing viewbox around the user, in degrees (~55km at the equator).
const BIAS_BOX_DEGREES = 0.5;

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

/**
 * How sure we are about the spot:
 *  - "building": an exact address
 *  - "block": the right block for that street number (interpolated)
 *  - "street": only the street was found; the number is the one typed, unverified
 */
type Precision = "building" | "block" | "street";

type Candidate = {
  label: string;
  address: string;
  precision: Precision;
  hasHouseNumber: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};

const RANK: Record<Precision, number> = { building: 0, block: 1, street: 2 };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const hasOrigin = req.nextUrl.searchParams.has("lat") && Number.isFinite(lat) && Number.isFinite(lon);

  const typedNumber = extractHouseNumber(q);

  const params: Record<string, string> = { q, limit: "8" };
  if (hasOrigin) {
    // Bias (not restrict) results toward a box around the user's current location.
    params.viewbox = [
      lon - BIAS_BOX_DEGREES,
      lat + BIAS_BOX_DEGREES,
      lon + BIAS_BOX_DEGREES,
      lat - BIAS_BOX_DEGREES,
    ].join(",");
    params.bounded = "0";
  }

  // The BC government geocoder knows house numbers that OpenStreetMap lacks. Ask it
  // when a number was typed, unless we know the person is somewhere outside BC.
  const askBc = typedNumber !== null && !(hasOrigin && !inBritishColumbia(lat, lon));
  const [osm, bc] = await Promise.all([
    nominatim<NominatimResult[]>("search", params),
    askBc ? bcGeocode(q) : Promise.resolve([]),
  ]);
  if (!osm && bc.length === 0) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const distance = (la: number, lo: number) =>
    hasOrigin ? haversineDistanceKm(lat, lon, la, lo) : null;

  const candidates: Candidate[] = [];

  for (const r of bc) {
    candidates.push({
      label: r.label,
      address: r.address,
      precision: r.precision,
      hasHouseNumber: true,
      latitude: r.latitude,
      longitude: r.longitude,
      distanceKm: distance(r.latitude, r.longitude),
    });
  }

  for (const item of osm ?? []) {
    const la = Number(item.lat);
    const lo = Number(item.lon);
    const verified = Boolean(item.address?.house_number);
    if (verified) {
      candidates.push({
        label: item.display_name,
        address: shortAddress(item.address) ?? item.display_name,
        precision: "building",
        hasHouseNumber: true,
        latitude: la,
        longitude: lo,
        distanceKm: distance(la, lo),
      });
    } else {
      // Only the street is known. Keep the number the person typed so it isn't lost,
      // and leave the postcode out: it belongs to this part of the street, not their number.
      const withTyped = typedNumber
        ? shortAddress({ ...item.address, house_number: typedNumber }, { omitPostcode: true })
        : null;
      candidates.push({
        label: item.display_name,
        address: withTyped ?? shortAddress(item.address) ?? item.display_name,
        precision: "street",
        hasHouseNumber: false,
        latitude: la,
        longitude: lo,
        distanceKm: distance(la, lo),
      });
    }
  }

  // If we found the number somewhere reliable, street-only matches are just noise.
  const hasPrecise = candidates.some((c) => c.precision !== "street");
  const kept = typedNumber && hasPrecise ? candidates.filter((c) => c.precision !== "street") : candidates;

  // With the person's location, nearest first (that is what they mean by "Lawson
  // Avenue"). Without it, most precise first.
  kept.sort((a, b) =>
    hasOrigin
      ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || RANK[a.precision] - RANK[b.precision]
      : RANK[a.precision] - RANK[b.precision],
  );

  // The same place can come back more than once (two sources, entrances, postcodes).
  // Drop a result with the same text, or a precise one within ~120 m of one already kept.
  const seen = new Set<string>();
  const results: Candidate[] = [];
  for (const c of kept) {
    const key = c.address.toLowerCase();
    if (seen.has(key)) continue;
    const duplicate =
      c.precision !== "street" &&
      results.some(
        (r) =>
          r.precision !== "street" &&
          haversineDistanceKm(r.latitude, r.longitude, c.latitude, c.longitude) < 0.12,
      );
    if (duplicate) continue;
    seen.add(key);
    results.push(c);
  }

  return NextResponse.json({ results: results.slice(0, 5) });
}
