"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Two-step cancel so a stray tap doesn't release the booking. */
export function CancelSpotButton({ adId }: { adId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/${adId}/cancel`, { method: "POST" });
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

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 w-full rounded-[var(--radius-btn)] border border-brand-green bg-white py-3 text-sm font-bold text-brand-green"
      >
        Cancel my spot
      </button>
    );
  }

  return (
    <div className="mt-4 text-neutral-800" role="alertdialog" aria-label="Cancel your spot?">
      <p className="mb-3 text-sm font-semibold">Cancel your spot? Someone else will be able to book it.</p>
      {error && <p className="mb-2 text-sm font-normal text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-[var(--radius-btn)] border border-brand-border bg-white py-3 text-sm font-bold text-neutral-700 disabled:opacity-50"
        >
          Keep my spot
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-brand-pink py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Yes, cancel"}
        </button>
      </div>
    </div>
  );
}
