"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { simTimeFor, type SimClock } from "@/lib/now";
import type { Rules } from "@/lib/rules";

type Booking = {
  id: string;
  title: string;
  buyer: string;
  slot: string;
  releaseAt: string;
  releaseInput: string | null;
  overdue: boolean;
};
type Released = { id: string; adId: string; title: string; buyer: string; at: string; corrected: boolean };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Rules shown in friendly units. The API takes milliseconds for timings.
const RULE_FIELDS: { key: keyof Rules; label: string; unit: "count" | "hours" }[] = [
  { key: "maxActiveBookings", label: "Booking limit per person", unit: "count" },
  { key: "releaseAfterSlotEndsMs", label: "Release dated booking, hours after slot ends", unit: "hours" },
  { key: "releaseAsapAfterMs", label: "Release ASAP booking, hours after booking", unit: "hours" },
  { key: "releaseAnytimeAfterMs", label: "Release anytime booking, hours after booking", unit: "hours" },
  { key: "undoWindowMs", label: "Poster can correct a no-show for, hours", unit: "hours" },
];
const toField = (key: keyof Rules, rules: Rules) =>
  RULE_FIELDS.find((f) => f.key === key)?.unit === "hours" ? String(rules[key] / HOUR) : String(rules[key]);

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-[var(--radius-card)] border border-brand-border bg-white p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

const btn = "rounded-[var(--radius-btn)] border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-neutral-800 disabled:opacity-50";
const primary = "rounded-[var(--radius-btn)] bg-brand-navy px-3 py-2 text-sm font-bold text-white disabled:opacity-50";

export function SimPanel({
  clock,
  nowMs,
  nowInput,
  rules,
  viewer,
  personas,
  scenarios,
  bookings,
  released,
}: {
  clock: SimClock | null;
  /** The (simulated) time when the server rendered the page. */
  nowMs: number;
  nowInput: string;
  rules: Rules;
  viewer: { name: string; email: string | null } | null;
  personas: { key: string; name: string }[];
  scenarios: { name: string; description: string }[];
  bookings: Booking[];
  released: Released[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [setTo, setSetTo] = useState(nowInput);
  const [scenario, setScenario] = useState(scenarios.some((s) => s.name === "booked-ads") ? "booked-ads" : (scenarios[0]?.name ?? "empty"));
  const [ruleValues, setRuleValues] = useState(() =>
    Object.fromEntries(RULE_FIELDS.map((f) => [f.key, toField(f.key, rules)])) as Record<keyof Rules, string>,
  );

  // A live clock: the server sent the anchor, the browser keeps it ticking.
  const [display, setDisplay] = useState(nowMs);
  // When the server sends a new time (after a jump or a refresh), show it straight away and
  // move the "Jump to" box to it. Adjusting state during render is React's pattern for this.
  const [shownFor, setShownFor] = useState(nowInput);
  if (shownFor !== nowInput) {
    setShownFor(nowInput);
    setSetTo(nowInput);
    setDisplay(nowMs);
  }
  useEffect(() => {
    const t = setInterval(() => setDisplay(clock ? simTimeFor(clock) : Date.now()), 1000);
    return () => clearInterval(t);
  }, [clock]);

  const speed = !clock ? "Real time" : clock.speed === 0 ? "Frozen" : clock.speed === 1 ? "Real speed" : `${clock.speed}x speed`;

  async function call(path: string, body: object, done: (data: Record<string, unknown>) => string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMessage({ text: done(data) });
      router.refresh();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Something went wrong", error: true });
    } finally {
      setBusy(false);
    }
  }

  const releasedText = (data: Record<string, unknown>) => {
    const jobs = data.jobs as { releasedMissedPickups?: string[] } | null | undefined;
    const list = jobs?.releasedMissedPickups ?? (data.releasedMissedPickups as string[] | undefined) ?? [];
    return list.length ? `Released ${list.length} missed ${list.length === 1 ? "pick-up" : "pick-ups"}.` : "Nothing was due for release.";
  };
  const clockCall = (body: object) => call("/api/sim/clock", body, (d) => `Clock updated. ${releasedText(d)}`);

  function saveRules() {
    const body: Record<string, number> = {};
    for (const f of RULE_FIELDS) {
      const n = Number(ruleValues[f.key]);
      if (!Number.isFinite(n) || n < 0) {
        setMessage({ text: `${f.label}: enter a number, 0 or more`, error: true });
        return;
      }
      body[f.key] = f.unit === "hours" ? Math.round(n * HOUR) : Math.round(n);
    }
    call("/api/sim/rules", body, () => "Rules saved.");
  }

  return (
    <div className="space-y-4 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Simulate controls</h1>
        <p className="text-sm text-neutral-500">Simulate mode only. Uses its own database, never your real data.</p>
      </div>

      {message && (
        <p
          role={message.error ? "alert" : "status"}
          data-testid="sim-message"
          className={`rounded-[var(--radius-btn)] p-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
        >
          {message.text}
        </p>
      )}

      <Card title="Clock">
        <p className="text-2xl font-black text-neutral-900" data-testid="sim-time">
          {new Date(display).toLocaleString("en-GB", {
            weekday: "short", day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })}
        </p>
        <p className="mb-3 text-sm text-neutral-500">{speed}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          {[["+15 min", 15 * MINUTE], ["+1 hour", HOUR], ["+1 day", 24 * HOUR], ["+3 days", 72 * HOUR]].map(([text, ms]) => (
            <button key={text as string} type="button" className={btn} disabled={busy} onClick={() => clockCall({ advanceMs: ms })}>
              {text}
            </button>
          ))}
        </div>

        <div className="mb-3 flex gap-2">
          <label className="sr-only" htmlFor="sim-set">Jump to</label>
          <input
            id="sim-set"
            type="datetime-local"
            value={setTo}
            onChange={(e) => setSetTo(e.target.value)}
            className="flex-1 rounded-[var(--radius-btn)] border border-brand-border p-2 text-sm"
          />
          <button type="button" className={primary} disabled={busy || !setTo} onClick={() => clockCall({ set: setTo })}>
            Jump to
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} disabled={busy} onClick={() => clockCall({ speed: 0 })}>Freeze</button>
          <button type="button" className={btn} disabled={busy} onClick={() => clockCall({ speed: 1 })}>Real speed</button>
          <button type="button" className={btn} disabled={busy} onClick={() => clockCall({ speed: 60 })}>60x (1 min per sec)</button>
          <button type="button" className={btn} disabled={busy} onClick={() => clockCall({ reset: true })}>Back to real time</button>
          <button
            type="button"
            className={btn}
            disabled={busy}
            onClick={() => call("/api/sim/jobs", {}, releasedText)}
          >
            Run jobs now
          </button>
        </div>
      </Card>

      <Card title="Bookings">
        {bookings.length === 0 ? (
          <p className="text-sm text-neutral-500">No ads are booked right now.</p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className="text-sm">
                <Link href={`/ads/${b.id}`} className="font-semibold text-brand-navy underline">{b.title}</Link>
                <p className="text-neutral-600">{b.buyer} · {b.slot}</p>
                <p className={b.overdue ? "font-semibold text-red-600" : "text-neutral-500"}>
                  Auto-release: {b.releaseAt}{b.overdue ? " (due now: run jobs)" : ""}
                </p>
                {b.releaseInput && !b.overdue && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-brand-navy underline"
                    disabled={busy}
                    onClick={() => clockCall({ set: b.releaseInput })}
                  >
                    Jump to release time
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {released.length > 0 && (
          <>
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">Released automatically</h3>
            <ul className="space-y-2">
              {released.map((r) => (
                <li key={r.id} className="text-sm text-neutral-600">
                  <Link href={`/ads/${r.adId}`} className="font-semibold text-brand-navy underline">{r.title}</Link>
                  {" "}· {r.buyer} · {r.at}{r.corrected ? " · corrected by poster" : " · counted as no-show"}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card title="Log in as">
        <p className="mb-3 text-sm text-neutral-600" data-testid="sim-viewer">
          {viewer ? `Logged in as ${viewer.name}${viewer.email ? ` (${viewer.email})` : ""}` : "Not logged in"}
        </p>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <button
              key={p.key}
              type="button"
              className={btn}
              disabled={busy}
              onClick={() => call("/api/sim/login-as", { persona: p.key }, () => `Logged in as ${p.name}.`)}
            >
              {p.name}
            </button>
          ))}
          <button type="button" className={btn} disabled={busy} onClick={() => call("/api/auth/logout", {}, () => "Logged out.")}>
            Log out
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Tip: use a private window for a second person at the same time.</p>
      </Card>

      <Card title="Scenario">
        <label htmlFor="sim-scenario" className="sr-only">Choose a scenario</label>
        <select
          id="sim-scenario"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="mb-2 w-full rounded-[var(--radius-btn)] border border-brand-border p-2 text-sm"
        >
          {scenarios.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        <p className="mb-3 text-sm text-neutral-600">{scenarios.find((s) => s.name === scenario)?.description}</p>
        <button
          type="button"
          className={primary}
          disabled={busy}
          onClick={() => {
            if (!window.confirm("This wipes the simulate database and resets the clock and rules. Continue?")) return;
            call("/api/sim/scenario", { name: scenario }, () => `Loaded "${scenario}". Clock set to Sat 5 Dec 2026, 09:00 (frozen). You are logged out of the old data.`);
          }}
        >
          Load scenario
        </button>
      </Card>

      <Card title="Rules">
        <div className="space-y-2">
          {RULE_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-neutral-700">
              <span>{f.label}</span>
              <input
                inputMode="decimal"
                value={ruleValues[f.key]}
                onChange={(e) => setRuleValues({ ...ruleValues, [f.key]: e.target.value })}
                className="w-20 rounded-[var(--radius-btn)] border border-brand-border p-2 text-right text-sm"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className={primary} disabled={busy} onClick={saveRules}>Save rules</button>
          <button
            type="button"
            className={btn}
            disabled={busy}
            onClick={() =>
              call("/api/sim/rules", { reset: true }, (d) => {
                const r = d.rules as Rules;
                setRuleValues(Object.fromEntries(RULE_FIELDS.map((f) => [f.key, toField(f.key, r)])) as Record<keyof Rules, string>);
                return "Rules reset to defaults.";
              })
            }
          >
            Reset to defaults
          </button>
        </div>
      </Card>
    </div>
  );
}
