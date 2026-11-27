import { cachedJson } from "@/lib/nominatim";

// DataBC's official address geocoder for British Columbia. Free, no key.
// https://github.com/bcgov/ols-geocoder
// OpenStreetMap often lacks house numbers; this service has them for BC.

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: { fullAddress: string; score: number; matchPrecision: string };
};

export type BcResult = {
  address: string;
  label: string;
  latitude: number;
  longitude: number;
  /** "building": a specific site or unit. "block": placed along the block face for that number. */
  precision: "building" | "block";
  score: number;
};

// Only these are real street addresses. STREET, LOCALITY and PROVINCE are too vague.
const BUILDING = new Set(["OCCUPANT", "SITE", "UNIT", "CIVIC_NUMBER"]);
const USABLE = new Set([...BUILDING, "BLOCK", "INTERSECTION"]);
const MIN_SCORE = 85;

/** A rough box around British Columbia, used only as a hint for whether to ask. */
export function inBritishColumbia(latitude: number, longitude: number) {
  return latitude >= 48.2 && latitude <= 60.1 && longitude >= -139.2 && longitude <= -114.0;
}

export async function bcGeocode(q: string): Promise<BcResult[]> {
  const url = new URL("https://geocoder.api.gov.bc.ca/addresses.json");
  url.searchParams.set("addressString", q);
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("outputSRS", "4326");
  url.searchParams.set("autoComplete", "true");
  url.searchParams.set("echo", "false");

  const data = await cachedJson<{ features?: Feature[] }>(url);
  return (data?.features ?? [])
    .filter((f) => f.properties.score >= MIN_SCORE && USABLE.has(f.properties.matchPrecision))
    .map((f) => ({
      address: f.properties.fullAddress.replace(/, BC$/, ""),
      label: f.properties.fullAddress,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
      precision: BUILDING.has(f.properties.matchPrecision) ? ("building" as const) : ("block" as const),
      score: f.properties.score,
    }));
}
