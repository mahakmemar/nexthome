"use client";

import { Continue } from "@/components/wizard/Continue";
import { CURRENCY } from "@/lib/money";

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
      <label htmlFor="price" className="mb-2 block text-center font-semibold text-neutral-800">
        Your price ({CURRENCY})
      </label>
      <div className="relative mb-6">
        <input
          id="price"
          type="number"
          min={0}
          inputMode="decimal"
          value={price}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-[var(--radius-btn)] border border-brand-border py-4 pl-4 pr-20 text-center text-3xl font-bold outline-none focus:border-brand-blue"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-neutral-400"
        >
          {CURRENCY}
        </span>
      </div>
      <Continue onClick={onContinue} disabled={price < 0} />
    </div>
  );
}
