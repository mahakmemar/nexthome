import { isSimulate } from "@/lib/sim/state";
import { fakeGeocoder } from "@/lib/sim/fake-geocoder";

// Server-side access to geocoders. Identical lookups are cached for a few
// minutes, so typing and retyping the same address doesn't hit a public service again.

const USER_AGENT = "SwapCommunity-Dev/1.0 (local learning project)";
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map<string, { at: number; data: unknown }>();

export async function cachedJson<T>(url: URL): Promise<T | null> {
  // Simulate mode answers from a fixed list of places and never calls the real services.
  if (isSimulate()) return fakeGeocoder(url) as T;

  const key = url.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    cache.set(key, { at: Date.now(), data });
    if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
    return data;
  } catch {
    return null;
  }
}

/** OpenStreetMap's Nominatim geocoder. */
export function nominatim<T>(
  endpoint: "search" | "reverse",
  params: Record<string, string>,
): Promise<T | null> {
  const url = new URL(`https://nominatim.openstreetmap.org/${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  return cachedJson<T>(url);
}
