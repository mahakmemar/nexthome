"use client";

import { Continue } from "@/components/wizard/Continue";
import type { WizardData } from "@/lib/wizard";

const PLACEMENTS = ["In the home", "Outside", "In the garage", "In a storage room"];

export function LocationDetailsStep({
  floor,
  doorCode,
  fitsInElevator,
  canHelpCarry,
  placement,
  onChange,
  onContinue,
}: {
  floor: string;
  doorCode: string;
  fitsInElevator: boolean;
  canHelpCarry: boolean;
  placement: string;
  onChange: (patch: Partial<WizardData>) => void;
  onContinue: () => void;
}) {
  return (
    <div className="px-4 py-6">
      <p className="mb-2 text-sm font-semibold text-neutral-800">Placement</p>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {PLACEMENTS.map((option) => (
          <button
            key={option}
            onClick={() => onChange({ placement: option })}
            className={`rounded-[var(--radius-btn)] border px-3 py-2 text-sm font-medium ${
              placement === option
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-brand-border text-neutral-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-neutral-800">Floor</span>
        <input
          value={floor}
          onChange={(e) => onChange({ floor: e.target.value })}
          placeholder="e.g. 2"
          className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-neutral-800">Door code</span>
        <input
          value={doorCode}
          onChange={(e) => onChange({ doorCode: e.target.value })}
          placeholder="Optional"
          className="w-full rounded-[var(--radius-btn)] border border-brand-border px-4 py-3 outline-none focus:border-brand-blue"
        />
      </label>

      <ToggleRow
        label="Fits in the elevator"
        value={fitsInElevator}
        onChange={(v) => onChange({ fitsInElevator: v })}
      />
      <ToggleRow
        label="Can help carry"
        value={canHelpCarry}
        onChange={(v) => onChange({ canHelpCarry: v })}
      />

      <p className="mt-6 text-sm text-neutral-400">
        We&apos;ll only show the door code to the helper you select for the pick-up. No door code?
        Leave it blank.
      </p>

      <Continue onClick={onContinue} />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-brand-border py-4">
      <span className="text-neutral-800">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`h-7 w-12 rounded-full transition-colors ${value ? "bg-brand-green" : "bg-neutral-300"}`}
      >
        <span
          className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
