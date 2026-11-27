"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT_LENGTH, OUTCOMES, type OutcomeKey } from "@/lib/rating-rules";

/** The poster says how the pick-up went. A no-show puts the ad back up for others. */
export function RateBuyerForm({ adId, buyerName }: { adId: string; buyerName: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsStars = outcome !== null && outcome !== "NO_SHOW";
  const ready = outcome !== null && (!needsStars || stars > 0);

  async function submit() {
    if (!outcome) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/${adId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          stars: needsStars ? stars : undefined,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-brand-border bg-white p-4 text-left text-neutral-800">
      <p className="text-sm font-bold">How did the pick-up go with {buyerName}?</p>

      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pick-up outcome">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={outcome === o.key}
            onClick={() => setOutcome(o.key)}
            className={`rounded-[var(--radius-btn)] border px-2 py-3 text-center text-xs font-bold ${
              outcome === o.key
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-brand-border text-neutral-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {needsStars && (
        <div className="mt-3" role="radiogroup" aria-label="Star rating">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                onClick={() => setStars(n)}
                className={`text-3xl leading-none ${n <= stars ? "text-amber-400" : "text-neutral-300"}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}

      {outcome === "NO_SHOW" && (
        <p className="mt-3 text-xs text-neutral-500">
          Your ad will go back up so someone else can book it.
        </p>
      )}

      {outcome && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          placeholder="Add a note (optional)"
          className="mt-3 w-full rounded-[var(--radius-btn)] border border-brand-border p-2 text-sm"
        />
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!ready || loading}
        className="mt-3 w-full rounded-[var(--radius-btn)] bg-brand-pink py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Submit rating"}
      </button>
    </div>
  );
}
