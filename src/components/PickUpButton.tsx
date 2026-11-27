"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PickUpButton({
  adId,
  slot,
  signedIn,
  disabled,
}: {
  adId: string;
  /** The one time slot the helper chose. Required when the ad offers slots. */
  slot?: string | null;
  signedIn: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // After logging in or signing up, come back to this ad with the slot still chosen.
  const next = `/ads/${adId}${slot ? `?slot=${encodeURIComponent(slot)}` : ""}`;
  const loginHref = `/login?next=${encodeURIComponent(next)}`;
  const signupHref = `/signup?next=${encodeURIComponent(next)}`;

  async function handlePickUp() {
    setError(null);

    // Check before doing anything: a signed-out visitor must log in or sign up first.
    if (!signedIn) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}/pick-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slot ?? null }),
      });
      if (res.status === 401) {
        // Session expired or was cleared in another tab.
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-[56px] mx-auto max-w-[480px] px-4 pb-3">
      {needsAuth && (
        <div
          role="alert"
          className="mb-2 rounded-[var(--radius-card)] border border-brand-border bg-white p-3 shadow-lg"
        >
          <p className="mb-2 text-center text-sm font-semibold text-neutral-800">
            Log in or sign up to pick this up
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={loginHref}
              className="rounded-[var(--radius-btn)] border border-brand-navy py-3 text-center text-sm font-bold text-brand-navy"
            >
              Log in
            </Link>
            <Link
              href={signupHref}
              className="rounded-[var(--radius-btn)] bg-brand-navy py-3 text-center text-sm font-bold text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
      {error && <p className="mb-2 text-center text-sm text-red-600">{error}</p>}
      <button
        onClick={handlePickUp}
        disabled={disabled || loading}
        className="w-full rounded-[var(--radius-btn)] bg-brand-pink py-4 text-center text-base font-bold text-white shadow-lg disabled:opacity-50"
      >
        {loading ? "Picking up..." : "PICK UP"}
      </button>
    </div>
  );
}
