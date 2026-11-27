const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// ---------- readable addresses ----------

/** The parts of a Nominatim "address" object that we use. */
export type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  square?: string;
  amenity?: string;
  building?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  postcode?: string;
  country_code?: string;
};

// Countries that write the number before the street ("12 Main St").
const NUMBER_FIRST = new Set(["us", "ca", "gb", "au", "ie", "nz"]);

/**
 * A short, readable address: "Storgatan 12, 171 52 Solna" (Sweden) or
 * "12 Main St, V6B 1A1 Vancouver". Returns null if there is nothing usable.
 */
export function shortAddress(
  a: NominatimAddress | undefined,
  options: { omitPostcode?: boolean } = {},
): string | null {
  if (!a) return null;
  const street = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? a.square;
  const place = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb;

  let line1: string | undefined;
  if (street) {
    line1 = a.house_number
      ? NUMBER_FIRST.has(a.country_code ?? "")
        ? `${a.house_number} ${street}`
        : `${street} ${a.house_number}`
      : street;
  } else {
    line1 = a.amenity ?? a.building;
  }

  const line2 = [options.omitPostcode ? undefined : a.postcode, place].filter(Boolean).join(" ");
  const parts = [line1, line2].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/**
 * The house number someone typed, if there is one: "1403 Lawson Avenue, West
 * Vancouver" -> "1403", "Storgatan 12, Solna" -> "12". Only the first part (before
 * the first comma) is read, so postcodes like "171 52" are never mistaken for it.
 */
export function extractHouseNumber(query: string): string | null {
  const first = query.split(",")[0].trim();
  const leading = /^(\d{1,5}[A-Za-z]?)\s+\S/.exec(first);
  if (leading) return leading[1];
  const trailing = /\S\s+(\d{1,5}[A-Za-z]?)$/.exec(first);
  return trailing ? trailing[1] : null;
}

// ---------- searching ads by place ----------

/** How far from the searched place an ad can be and still be shown. */
export const NEARBY_KM = 15;

/** The place picked in the search box, read from the page address (?lat=&lon=&place=). */
export function parseSearchArea(params: { lat?: string; lon?: string; place?: string }) {
  if (!params.lat?.trim() || !params.lon?.trim()) return null;
  const latitude = Number(params.lat);
  const longitude = Number(params.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const place = (params.place ?? "").trim().slice(0, 120);
  return { latitude, longitude, place: place || "this area" };
}

/** A square around a point, used to narrow the database query before measuring exact distance. */
export function boundingBox(latitude: number, longitude: number, km: number) {
  const dLat = km / 111;
  const dLon = km / (111 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));
  return {
    minLat: latitude - dLat,
    maxLat: latitude + dLat,
    minLon: longitude - dLon,
    maxLon: longitude + dLon,
  };
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}
