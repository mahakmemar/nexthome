"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PickUpButton({ adId, disabled }: { adId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickUp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/${adId}/pick-up`, { method: "POST" });
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
