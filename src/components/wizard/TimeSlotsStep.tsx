"use client";

import { Continue } from "@/components/wizard/Continue";

const TODAY_SLOTS = ["21-22", "22-23", "23-00"];
const TOMORROW_SLOTS = [
  "00-01",
  "01-02",
  "02-03",
  "03-04",
  "04-05",
  "05-06",
  "06-07",
  "07-08",
  "08-09",
];

export function TimeSlotsStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (slots: string[]) => void;
  onContinue: () => void;
}) {
  function toggleSlot(slot: string) {
    if (value.includes(slot)) {
      onChange(value.filter((s) => s !== slot));
    } else {
      onChange([...value.filter((s) => s !== "asap" && s !== "anytime"), slot]);
    }
  }

  function chooseQuick(option: "asap" | "anytime") {
    onChange([option]);
  }

  return (
    <div className="px-4 py-6">
      <p className="mb-6 text-center text-sm text-neutral-500">
        Deliveries are usually done as soon as possible after the pick-up time
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
          <SlotButton key={slot} slot={slot} active={value.includes(slot)} onToggle={toggleSlot} />
        ))}
      </div>

      <p className="mb-2 text-center font-medium text-neutral-700">Tomorrow</p>
      <div className="grid grid-cols-3 gap-2">
        {TOMORROW_SLOTS.map((slot) => (
          <SlotButton key={slot} slot={slot} active={value.includes(slot)} onToggle={toggleSlot} />
        ))}
      </div>

      <Continue onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}

function SlotButton({
  slot,
  active,
  onToggle,
}: {
  slot: string;
  active: boolean;
  onToggle: (slot: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(slot)}
      className={`rounded-[var(--radius-btn)] border py-3 text-center text-sm font-semibold ${
        active ? "border-brand-blue bg-brand-blue text-white" : "border-brand-border bg-neutral-100 text-neutral-600"
      }`}
    >
      {slot}
    </button>
  );
}
