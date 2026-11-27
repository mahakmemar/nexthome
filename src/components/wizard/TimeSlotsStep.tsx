"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Continue } from "@/components/wizard/Continue";
import { currentTime } from "@/lib/now";
import {
  BOOKING_WINDOW_DAYS,
  FIRST_START_HOUR,
  LAST_START_HOUR,
  MAX_TIME_SLOTS,
  addDays,
  isFlexibleSlot,
  isSlotInPast,
  localDateString,
  makeDatedSlot,
  slotLabel,
  sortSlots,
} from "@/lib/slots";

const HOURS = Array.from(
  { length: LAST_START_HOUR - FIRST_START_HOUR + 1 },
  (_, i) => FIRST_START_HOUR + i,
);
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Pick a date, then one or more hours on it. Slots can be on different days, up
 * to MAX_TIME_SLOTS in total. "As soon as possible" and "Anytime" replace them.
 */
export function TimeSlotsStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (slots: string[]) => void;
  onContinue: () => void;
}) {
  const [now] = useState(() => currentTime());
  const today = localDateString(now);
  const days = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(today, i));

  const hasOpenHour = (day: string) =>
    HOURS.some((h) => !isSlotInPast(makeDatedSlot(day, h), now));
  // Late in the evening there may be no hours left today, so start on the next day.
  const [date, setDate] = useState(() => days.find(hasOpenHour) ?? days[0]);

  const chosen = sortSlots(value.filter((s) => !isFlexibleSlot(s)));
  const atLimit = chosen.length >= MAX_TIME_SLOTS;

  function toggle(slot: string) {
    if (value.includes(slot)) {
      onChange(value.filter((s) => s !== slot));
    } else if (!atLimit) {
      // Choosing a real slot replaces "asap"/"anytime".
      onChange([...chosen, slot]);
    }
  }

  function chooseQuick(option: "asap" | "anytime") {
    onChange([option]);
  }

  return (
    <div className="px-4 py-6">
      <p className="mb-2 text-center text-sm text-neutral-500">
        Offer up to {MAX_TIME_SLOTS} times. The helper picks one.
      </p>
      <p
        aria-live="polite"
        className={`mb-5 text-center text-sm font-medium ${atLimit ? "text-brand-pink" : "text-neutral-700"}`}
      >
        {chosen.length}/{MAX_TIME_SLOTS} selected
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {(["asap", "anytime"] as const).map((option) => (
          <button
            key={option}
            onClick={() => chooseQuick(option)}
            aria-pressed={value.includes(option)}
            className={`rounded-[var(--radius-btn)] border p-4 text-center text-sm font-semibold ${
              value.includes(option)
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-brand-border bg-neutral-100 text-neutral-700"
            }`}
          >
            {slotLabel(option)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-center font-medium text-neutral-700">Pick a date</p>
      <div
        role="group"
        aria-label="Pick a date"
        className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]"
      >
        {days.map((day) => {
          const [y, m, d] = day.split("-").map(Number);
          const dt = new Date(y, m - 1, d, 12);
          const picked = chosen.filter((s) => s.startsWith(day)).length;
          const active = day === date;
          return (
            <button
              key={day}
              onClick={() => setDate(day)}
              aria-pressed={active}
              disabled={!hasOpenHour(day)}
              className={`relative flex w-16 flex-none flex-col items-center rounded-[var(--radius-btn)] border py-2 text-xs disabled:opacity-40 ${
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-brand-border bg-neutral-100 text-neutral-700"
              }`}
            >
              <span className="font-medium">
                {day === today ? "Today" : dt.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span className="text-base font-bold">{d}</span>
              <span>{dt.toLocaleDateString("en-GB", { month: "short" })}</span>
              {picked > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-[11px] font-bold text-white">
                  {picked}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-center font-medium text-neutral-700">Pick the times</p>
      <div className="grid grid-cols-3 gap-2">
        {HOURS.map((hour) => {
          const slot = makeDatedSlot(date, hour);
          const active = value.includes(slot);
          const unavailable = isSlotInPast(slot, now) || (atLimit && !active);
          return (
            <button
              key={slot}
              onClick={() => toggle(slot)}
              disabled={unavailable}
              aria-pressed={active}
              className={`rounded-[var(--radius-btn)] border py-3 text-center text-sm font-semibold disabled:opacity-40 ${
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-brand-border bg-neutral-100 text-neutral-600"
              }`}
            >
              {pad(hour)}:00–{pad(hour + 1)}:00
            </button>
          );
        })}
      </div>

      {atLimit && (
        <p className="mt-3 text-center text-xs text-neutral-500">
          You&apos;ve reached the limit. Remove a time to pick a different one.
        </p>
      )}

      {chosen.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-neutral-800">Your times</p>
          <ul className="flex flex-wrap gap-2">
            {chosen.map((slot) => (
              <li key={slot}>
                <button
                  onClick={() => toggle(slot)}
                  aria-label={`Remove ${slotLabel(slot, now)}`}
                  className="flex items-center gap-1 rounded-full bg-brand-navy py-1.5 pl-3 pr-2 text-xs font-semibold text-white"
                >
                  {slotLabel(slot, now)}
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Continue onClick={onContinue} disabled={value.length === 0} />
    </div>
  );
}
