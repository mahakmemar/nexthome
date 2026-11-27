"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDistance } from "@/lib/geo";

type Suggestion = {
  label: string;
  address?: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};

type Coords = { latitude: number; longitude: number };

export function LocationSearch({ initialPlace }: { initialPlace?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialPlace ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Coords | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRequestedOrigin = useRef(false);
  // The place already applied to the page, so we don't search for it again.
  const appliedPlace = useRef(initialPlace ?? null);

  const trimmedQuery = query.trim();

  function requestOriginSilently() {
    if (hasRequestedOrigin.current || !navigator.geolocation) return;
    hasRequestedOrigin.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => {
        // Permission denied or unavailable — fall back to unbiased search, no error shown.
      },
      { maximumAge: 5 * 60 * 1000 },
    );
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmedQuery.length < 3 || trimmedQuery === appliedPlace.current) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmedQuery });
        if (origin) {
          params.set("lat", String(origin.latitude));
          params.set("lon", String(origin.longitude));
        }
        const res = await fetch(`/api/geocode?${params.toString()}`);
        const body = await res.json();
        setSuggestions(body.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery, origin]);

  const visibleSuggestions = trimmedQuery.length >= 3 ? suggestions : [];

  // Choosing a place puts it in the page address, so the page shows only ads near it.
  function applyPlace(place: string, latitude: number, longitude: number) {
    appliedPlace.current = place;
    setQuery(place);
    setSuggestions([]);
    setOpen(false);
    router.push(`/?${new URLSearchParams({ lat: String(latitude), lon: String(longitude), place })}`);
  }

  function selectSuggestion(suggestion: Suggestion) {
    applyPlace(suggestion.address ?? suggestion.label, suggestion.latitude, suggestion.longitude);
  }

  function clearSearch() {
    appliedPlace.current = null;
    setQuery("");
    setSuggestions([]);
    setError(null);
    if (initialPlace) router.push("/");
  }

  async function fillAddressFromCoords(latitude: number, longitude: number) {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
      const body = await res.json();
      applyPlace(body.address ?? body.label ?? "your location", latitude, longitude);
    } catch {
      setError("Couldn't determine your address");
    } finally {
      setLocating(false);
    }
  }

  function useCurrentLocation() {
    if (origin) {
      setLocating(true);
      fillAddressFromCoords(origin.latitude, origin.longitude);
      return;
    }

    if (!navigator.geolocation) {
      setError("Location isn't available on this device");
      return;
    }

    setLocating(true);
    setError(null);
    hasRequestedOrigin.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin({ latitude, longitude });
        fillAddressFromCoords(latitude, longitude);
      },
      () => {
        setError("Location permission was denied");
        setLocating(false);
      },
    );
  }

  return (
    <div className="relative px-4 py-3">
      <div className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-brand-border bg-neutral-50 px-3 py-2.5">
        <MagnifyingGlassIcon className="h-4 w-4 flex-none text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            requestOriginSilently();
          }}
          onKeyDown={(e) => {
            // Enter picks the top suggestion, so typing a place and pressing Enter works.
            if (e.key === "Enter" && visibleSuggestions[0]) {
              e.preventDefault();
              selectSuggestion(visibleSuggestions[0]);
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search your area or address"
          className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="flex-none text-neutral-400 hover:text-neutral-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute inset-x-4 top-full z-20 mt-1 overflow-hidden rounded-[var(--radius-card)] border border-brand-border bg-white shadow-lg">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={useCurrentLocation}
            disabled={locating}
            className="flex w-full items-center gap-2 border-b border-brand-border px-4 py-3 text-left text-sm font-semibold text-brand-blue disabled:opacity-50"
          >
            <MapPinIcon className="h-4 w-4 flex-none" />
            {locating ? "Finding your location..." : "Use my current location"}
          </button>

          {loading && (
            <p className="px-4 py-3 text-sm text-neutral-400">Searching...</p>
          )}

          {!loading &&
            visibleSuggestions.map((s) => (
              <button
                key={`${s.latitude}-${s.longitude}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-none text-neutral-400" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block">{s.address ?? s.label}</span>
                  {s.distanceKm != null && (
                    <span className="text-xs text-neutral-400">{formatDistance(s.distanceKm)}</span>
                  )}
                </span>
              </button>
            ))}

          {!loading && trimmedQuery.length >= 3 && visibleSuggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-neutral-400">No matches found.</p>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
