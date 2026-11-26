"use client";

import { Continue } from "@/components/wizard/Continue";

export function AddressStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (address: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="px-4 py-6">
      <p className="mb-3 font-semibold text-neutral-800">Enter pick-up address:</p>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Street and number, city"
        className="w-full rounded-[var(--radius-btn)] border border-brand-border bg-white px-4 py-3 text-neutral-900 outline-none focus:border-brand-blue"
      />
      <Continue onClick={onContinue} disabled={value.trim().length < 3} />
    </div>
  );
}
