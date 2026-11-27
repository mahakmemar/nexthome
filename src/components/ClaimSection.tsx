"use client";

import Link from "next/link";
import { useState } from "react";
import { PickUpButton } from "@/components/PickUpButton";
import { groupSlotsByDay, isFlexibleSlot, slotLabel } from "@/lib/slots";

/**
 * Lets a helper choose exactly ONE of the time slots the poster offered, then
 * pick up the ad. Selecting a slot replaces any previous selection. If the poster
 * offered only one slot it is pre-selected.
 */
export function ClaimSection({
  adId,
  timeSlots,
  signedIn,
  initialSlot,
  atLimit = false,
  maxBookings,
  expired = false,
}: {
  adId: string;
  timeSlots: string[];
  signedIn: boolean;
  /** A slot chosen before logging in, restored when they come back. */
  initialSlot?: string | null;
  /** The person already has the maximum number of ads booked. */
  atLimit?: boolean;
  maxBookings?: number;
  /** Every time slot the poster offered has already passed. */
  expired?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(
    initialSlot && timeSlots.includes(initialSlot)
      ? initialSlot
      : timeSlots.length === 1
        ? timeSlots[0]
        : null,
  );

  const flexible = timeSlots.filter(isFlexibleSlot);
  const days = groupSlotsByDay(timeSlots);
  const hasSlots = timeSlots.length > 0;

  return (
    <>
      {expired && (
        <div
          role="status"
          className="mt-6 rounded-[var(--radius-card)] bg-neutral-100 p-4 text-sm text-neutral-700"
        >
          <p className="font-semibold">The time slots for this ad have passed.</p>
          <p className="mt-1">It can&apos;t be booked anymore.</p>
        </div>
      )}
      {atLimit && (
        <div
          role="status"
          className="mt-6 rounded-[var(--radius-card)] bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-semibold">
            You&apos;ve reached the limit of {maxBookings} booked ads.
          </p>
          <p className="mt-1">
            Cancel one of your bookings to book this one.{" "}
            <Link href="/my-ads" className="font-semibold underline">
              See my bookings
            </Link>
          </p>
        </div>
      )}
      {hasSlots && (
        <section className="mt-6" aria-labelledby="slots-heading">
          <h2 id="slots-heading" className="text-base font-bold text-neutral-900">
            Pick a time slot
          </h2>
          <p className="mb-3 text-sm text-neutral-500">Choose one to pick this up.</p>

          <div role="radiogroup" aria-labelledby="slots-heading" className="space-y-3">
            {flexible.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {flexible.map((slot) => (
                  <SlotOption
                    key={slot}
                    slot={slot}
                    label={slotLabel(slot)}
                    selected={selected === slot}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            )}
            {days.map((day) => (
              <div key={day.key}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {day.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {day.items.map((item) => (
                    <SlotOption
                      key={item.slot}
                      slot={item.slot}
                      label={item.label}
                      selected={selected === item.slot}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!selected && (
            <p className="mt-3 text-xs text-neutral-500">Select a time slot to enable PICK UP.</p>
          )}
        </section>
      )}

      <PickUpButton
        adId={adId}
        slot={selected}
        signedIn={signedIn}
        disabled={atLimit || expired || (hasSlots && !selected)}
      />
    </>
  );
}

function SlotOption({
  slot,
  label,
  selected,
  onSelect,
}: {
  slot: string;
  label: string;
  selected: boolean;
  onSelect: (slot: string) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(slot)}
      className={`rounded-[var(--radius-btn)] border py-3 text-center text-sm font-semibold ${
        selected
          ? "border-brand-navy bg-brand-navy text-white"
          : "border-brand-border bg-neutral-100 text-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}
