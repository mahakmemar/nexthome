"use client";

import { Continue } from "@/components/wizard/Continue";
import {
  MAX_TIME_SLOTS,
  TODAY_SLOTS,
  TOMORROW_SLOTS,
  isFlexibleSlot,
} from "@/lib/slots";

export function TimeSlotsStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (slots: string[]) => void;
  onContinue: () => void;
}) {
  const hourlySelected = value.filter((s) => !isFlexibleSlot(s));
  const atLimit = hourlySelected.length >= MAX_TIME_SLOTS;

  function toggleSlot(slot: string) {
    if (value.includes(slot)) {
      onChange(value.filter((s) => s !== slot));
      return;
    }
    // Picking an hourly slot replaces "asap"/"anytime", and is capped at 5.
    if (atLimit) return;
    onChange([...hourlySelected, slot]);
  }

  function chooseQuick(option: "asap" | "anytime") {
    onChange([option]);
  }

  return (
    <div className="px-4 py-6">
      <p className="mb-2 text-center text-sm text-neutral-500">
        Deliveries are usually done as soon as possible after the pick-up time
      </p>
      <p className="mb-6 text-center text-sm font-medium text-neutral-700">
        Offer up to {MAX_TIME_SLOTS} time slots. The helper picks one.{" "}
        <span aria-live="polite" className={atLimit ? "text-brand-pink" : "text-neutral-500"}>
          {hourlySelected.length}/{MAX_TIME_SLOTS} selected
        </span>
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => chooseQuick("asap")}
          className={`rounded-[var(--radius-btn)] border p-4 text-center text-sm font-semibold ${
            value.includes("asap")
              ? "border-brand-navy bg-brand-navy text-white"
              : "border-brand-border bg-neutral-100 text-neutral-700"
          }`}
        >
          As soon as possible
        </button>
        <button
          onClick={() => chooseQuick("anytime")}
          className={`rounded-[var(--radius-btn)] border p-4 text-center text-sm font-semibold ${
            value.includes("anytime")
              ? "border-brand-navy bg-brand-navy text-white"
              : "border-brand-border bg-neutral-100 text-neutral-700"
          }`}
        >
          Anytime
        </button>
      </div>

      <p className="mb-2 text-center font-medium text-neutral-700">Today</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {TODAY_SLOTS.map((slot) => (
          <SlotButton
            key={slot}
            slot={slot}
            active={value.includes(slot)}
            disabled={atLimit && !value.includes(slot)}
            onToggle={toggleSlot}
          />
        ))}
      </div>

      <p className="mb-2 text-center font-medium text-neutral-700">Tomorrow</p>
      <div className="grid grid-cols-3 gap-2">
        {TOMORROW_SLOTS.map((slot) => (
          <SlotButton
            key={slot}
            slot={slot}
            active={value.includes(slot)}
            disabled={atLimit && !value.includes(slot)}
            onToggle={toggleSlot}
          />
        ))}
      </div>

      {atLimit && (
        <p className="mt-3 text-center text-xs text-neutral-500">
          You&apos;ve reached the limit. Unselect a slot to pick a different one.
        </p>
      )}

      <Continue onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

function SlotButton({
  slot,
  active,
  disabled,
  onToggle,
}: {
  slot: string;
  active: boolean;
  disabled: boolean;
  onToggle: (slot: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(slot)}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-[var(--radius-btn)] border py-3 text-center text-sm font-semibold disabled:opacity-40 ${
        active ? "border-brand-blue bg-brand-blue text-white" : "border-brand-border bg-neutral-100 text-neutral-600"
      }`}
    >
      {slot}
    </button>
  );
}
