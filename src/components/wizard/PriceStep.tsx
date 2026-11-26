"use client";

import { Continue } from "@/components/wizard/Continue";

export function PriceStep({
  price,
  onChange,
  onContinue,
}: {
  price: number;
  onChange: (price: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="px-4 py-6">
      <p className="mb-6 text-center text-neutral-600">
        Other users have paid around <span className="font-bold text-neutral-900">150 - 350 SEK</span>
      </p>
      <p className="mb-2 text-center font-semibold text-neutral-800">Your price</p>
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mb-6 w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-4 text-center text-3xl font-bold outline-none focus:border-brand-blue"
      />
      <Continue onClick={onContinue} disabled={price < 0} />
    </div>
  );
}
