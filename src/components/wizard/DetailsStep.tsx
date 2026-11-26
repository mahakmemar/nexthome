"use client";

import { Continue } from "@/components/wizard/Continue";
import { SIZES, SizeKey } from "@/lib/types";
import type { WizardData } from "@/lib/wizard";

export function DetailsStep({
  title,
  description,
  size,
  onChange,
  onContinue,
}: {
  title: string;
  description: string;
  size: SizeKey;
  onChange: (patch: Partial<WizardData>) => void;
  onContinue: () => void;
}) {
  return (
    <div className="px-4 py-6">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-neutral-800">What do you need help with?</span>
        <span className="text-xs text-neutral-400">{title.length}/25</span>
      </div>
      <input
        value={title}
        maxLength={25}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="E.g. cardboards, empty bottles, broken chair, etc."
        className="mb-5 w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
      />

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-neutral-800">Description</span>
        <span className="text-xs text-neutral-400">{description.length}/1000</span>
      </div>
      <textarea
        value={description}
        maxLength={1000}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Add important information, e.g. measurements, weight, and whether it fits in a regular car or if a van or trailer is needed."
        rows={4}
        className="mb-6 w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
      />

      <p className="mb-3 text-sm font-semibold text-neutral-800">How big is the collection?</p>
      <div className="mb-6 grid grid-cols-4 gap-2">
        {SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange({ size: s.key })}
            className={`rounded-[var(--radius-btn)] border p-3 text-center text-sm font-semibold ${
              size === s.key ? "border-brand-navy bg-brand-navy text-white" : "border-brand-border text-neutral-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Continue onClick={onContinue} disabled={title.trim().length === 0} />
    </div>
  );
}
