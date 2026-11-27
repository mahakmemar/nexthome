"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { extractHouseNumber } from "@/lib/geo";

export type AddressValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type Suggestion = {
  label: string;
  address: string;
  hasHouseNumber: boolean;
  /** building = exact address, block = right block for that number, street = street only */
  precision: "building" | "block" | "street";
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};

type Coords = { latitude: number; longitude: number };

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}

const PRECISION_TAG: Record<Suggestion["precision"], string> = {
  building: "Exact address",
  block: "Along the block",
  street: "Street only, number not verified",
};

const LOCATION_ERRORS: Record<number, string> = {
  1: "Location permission was denied. You can type the address instead.",
  2: "Your device couldn't work out where you are. Type the address instead.",
  3: "Finding your location took too long. Try again or type the address.",
};

/**
 * An address field that suggests addresses as you type and can fill itself in from
 * your current location. When an address is picked, its exact coordinates are kept
 * so helpers can find the spot; typing afterwards clears them.
 */
export function AddressAutocomplete({
  address: value,
  latitude,
  longitude,
  onChange,
}: AddressValue & { onChange: (next: AddressValue) => void }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracyNote, setAccuracyNote] = useState<string | null>(null);
  const [missingNumber, setMissingNumber] = useState(false);
  // How the current address was chosen. Decides what we tell the person about it.
  const [picked, setPicked] = useState<Suggestion["precision"] | "device" | null>(null);
  const [origin, setOrigin] = useState<Coords | null>(null);
  const cache = useRef(new Map<string, Suggestion[]>());
  const query = value.trim();
  const confirmed = latitude !== null && longitude !== null;

  // If location access was already allowed, use it quietly to rank nearby addresses
  // first. We never trigger a permission prompt without the person asking for it.
  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          (p) => setOrigin({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => {},
          { maximumAge: 5 * 60 * 1000 },
        );
      })
      .catch(() => {});
  }, []);

  // Look up suggestions shortly after the person stops typing.
  useEffect(() => {
    if (!open || confirmed || query.length < 3) return;
    const controller = new AbortController();
    const key = `${query.toLowerCase()}|${origin ? `${origin.latitude.toFixed(2)},${origin.longitude.toFixed(2)}` : ""}`;

    const timer = setTimeout(async () => {
      const hit = cache.current.get(key);
      if (hit) {
        setSuggestions(hit);
        setActive(-1);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (origin) {
          params.set("lat", String(origin.latitude));
          params.set("lon", String(origin.longitude));
        }
        const res = await fetch(`/api/geocode?${params}`, { signal: controller.signal });
        const body = await res.json();
        const results: Suggestion[] = body.results ?? [];
        cache.current.set(key, results);
        setSuggestions(results);
        setActive(-1);
      } catch {
        // Aborted by a newer keystroke, or the lookup failed: keep what was shown.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, confirmed, origin]);

  const showList = open && !confirmed && query.length >= 3;

  function pick(s: Suggestion) {
    // A street-only match has no trustworthy point (a street can be kilometres long), so
    // keep the address text with the number the person typed, but save no coordinates.
    if (s.precision === "street") {
      onChange({ address: s.address, latitude: null, longitude: null });
    } else {
      onChange({ address: s.address, latitude: s.latitude, longitude: s.longitude });
    }
    setPicked(s.precision);
    setMissingNumber(false);
    setAccuracyNote(null);
    setError(null);
    setOpen(false);
    setActive(-1);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available on this device. Type the address instead.");
      return;
    }
    setLocating(true);
    setError(null);
    setAccuracyNote(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon, accuracy } = position.coords;
        setOrigin({ latitude: lat, longitude: lon });
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          const body = await res.json();
          if (!res.ok || !body.address) throw new Error("no address");
          // Keep the device's own coordinates: they are more exact than the address point.
          onChange({ address: body.address, latitude: lat, longitude: lon });
          setPicked("device");
          setMissingNumber(!body.hasHouseNumber);
          if (accuracy > 100) {
            setAccuracyNote(
              `Your device placed you within about ${Math.round(accuracy)} m. Check the address and correct it if needed.`,
            );
          }
          setOpen(false);
        } catch {
          setError("We found your location but couldn't turn it into an address. Type it instead.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError(LOCATION_ERRORS[err.code] ?? "Couldn't get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        autoFocus
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="street-address"
        value={value}
        onChange={(e) => {
          // Typing changes the address, so any earlier exact location no longer applies.
          onChange({ address: e.target.value, latitude: null, longitude: null });
          setMissingNumber(false);
          setPicked(null);
          setAccuracyNote(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder="Street and number, city"
        className="w-full rounded-[var(--radius-btn)] border border-brand-border bg-white px-4 py-3 text-neutral-900 outline-none focus:border-brand-blue"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-[var(--radius-card)] border border-brand-border bg-white shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-neutral-400">Searching...</li>
          )}
          {!loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-neutral-400">
              No matches. Check the spelling or use your current location.
            </li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={`${s.latitude}-${s.longitude}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-start gap-2 px-4 py-3 text-sm ${
                i === active ? "bg-neutral-100" : "hover:bg-neutral-50"
              }`}
            >
              <MapPinIcon className="mt-0.5 h-4 w-4 flex-none text-neutral-400" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-neutral-900">{s.address}</span>
                <span
                  className={`block text-xs ${s.precision === "street" ? "text-amber-700" : "text-neutral-500"}`}
                >
                  {PRECISION_TAG[s.precision]}
                </span>
                {s.distanceKm != null && (
                  <span className="text-xs text-neutral-400">{formatDistance(s.distanceKm)}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={useCurrentLocation}
        disabled={locating}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-brand-blue py-3 text-sm font-semibold text-brand-blue disabled:opacity-50"
      >
        <MapPinIcon className="h-4 w-4" />
        {locating ? "Finding your location..." : "Use my current location"}
      </button>

      <div className="mt-3 space-y-1 text-sm" aria-live="polite">
        {confirmed && (
          <p className="flex items-center gap-1 text-brand-green">
            <CheckCircleIcon className="h-4 w-4" />
            {picked === "block" ? "Location saved" : "Exact location saved"}
          </p>
        )}
        {confirmed && picked === "block" && (
          <p className="text-neutral-600">
            This is placed along the right block for that number, not on the exact building.
          </p>
        )}
        {picked === "street" && (
          <p className="text-amber-700">
            We found the street, but not number {extractHouseNumber(value) ?? "that number"} in our
            map data. Your address is saved as typed, without an exact pin.
          </p>
        )}
        {confirmed && missingNumber && (
          <p className="text-amber-700">
            No street number was found. Add it to the address if you can.
          </p>
        )}
        {accuracyNote && <p className="text-amber-700">{accuracyNote}</p>}
        {!confirmed && picked === null && query.length >= 3 && !error && (
          <p className="text-neutral-500">
            Pick a suggestion, or use your location, so the helper finds the exact spot.
          </p>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}
