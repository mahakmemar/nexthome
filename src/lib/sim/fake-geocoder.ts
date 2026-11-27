// Simulate mode never calls the real address services (OpenStreetMap Nominatim and the BC
// geocoder): tests must be fast, repeatable and not load a free public service. Instead every
// lookup is answered from this small list of places, in the same shape the real services use.
//
// Server-only.

export type FakePlace = {
  /** What a person might type, lower case. A query matches if it contains one of these. */
  match: string[];
  houseNumber?: string;
  road?: string;
  city: string;
  postcode?: string;
  latitude: number;
  longitude: number;
};

export const FAKE_PLACES: FakePlace[] = [
  { match: ["800 robson"], houseNumber: "800", road: "Robson Street", city: "Vancouver", postcode: "V6Z 3B7", latitude: 49.2827, longitude: -123.1207 },
  { match: ["1055 canada"], houseNumber: "1055", road: "Canada Place", city: "Vancouver", postcode: "V6C 0C3", latitude: 49.2888, longitude: -123.1111 },
  { match: ["4700 kingsway"], houseNumber: "4700", road: "Kingsway", city: "Burnaby", postcode: "V5H 4M1", latitude: 49.2276, longitude: -123.0004 },
  { match: ["vancouver"], city: "Vancouver", latitude: 49.2827, longitude: -123.1207 },
  { match: ["kitsilano"], city: "Kitsilano", latitude: 49.2684, longitude: -123.1683 },
  { match: ["victoria"], city: "Victoria", latitude: 48.4284, longitude: -123.3656 },
];

const display = (p: FakePlace) =>
  [p.houseNumber && p.road ? `${p.houseNumber} ${p.road}` : p.road, p.city, "British Columbia", p.postcode, "Canada"]
    .filter(Boolean)
    .join(", ");

const osmItem = (p: FakePlace) => ({
  display_name: display(p),
  lat: String(p.latitude),
  lon: String(p.longitude),
  address: { house_number: p.houseNumber, road: p.road, city: p.city, postcode: p.postcode },
});

function matching(q: string) {
  const query = q.toLowerCase();
  return FAKE_PLACES.filter((p) => p.match.some((m) => query.includes(m)));
}

/** Answers a geocoder request URL the way the real service would. */
export function fakeGeocoder(url: URL): unknown {
  if (url.hostname === "geocoder.api.gov.bc.ca") {
    const found = matching(url.searchParams.get("addressString") ?? "").filter((p) => p.houseNumber);
    return {
      features: found.map((p) => ({
        geometry: { coordinates: [p.longitude, p.latitude] },
        properties: { fullAddress: `${p.houseNumber} ${p.road}, ${p.city}, BC`, score: 100, matchPrecision: "CIVIC_NUMBER" },
      })),
    };
  }
  if (url.pathname.endsWith("/reverse")) {
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const nearest = [...FAKE_PLACES]
      .filter((p) => p.houseNumber)
      .sort((a, b) => Math.hypot(a.latitude - lat, a.longitude - lon) - Math.hypot(b.latitude - lat, b.longitude - lon))[0];
    return nearest ? osmItem(nearest) : {};
  }
  return matching(url.searchParams.get("q") ?? "").map(osmItem);
}
