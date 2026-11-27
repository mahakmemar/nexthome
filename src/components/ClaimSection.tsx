"use client";

import Link from "next/link";
import { useState } from "react";
import { PickUpButton } from "@/components/PickUpButton";
import { TODAY_SLOTS, TOMORROW_SLOTS, isFlexibleSlot, slotLabel } from "@/lib/slots";

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
}: {
  adId: string;
  timeSlots: string[];
  signedIn: boolean;
  /** The person already has the maximum number of ads booked. */
  atLimit?: boolean;
  maxBookings?: number;
  /** A slot chosen before logging in, restored when they come back. */
  initialSlot?: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(
    initialSlot && timeSlots.includes(initialSlot)
      ? initialSlot
      : timeSlots.length === 1
        ? timeSlots[0]
        : null,
  );

  const flexible = timeSlots.filter(isFlexibleSlot);
  const today = TODAY_SLOTS.filter((s) => timeSlots.includes(s));
  const tomorrow = TOMORROW_SLOTS.filter((s) => timeSlots.includes(s));
  const hasSlots = timeSlots.length > 0;

  return (
    <>
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
            {today.length > 0 && (
              <SlotGroup title="Today" slots={today} selected={selected} onSelect={setSelected} />
            )}
            {tomorrow.length > 0 && (
              <SlotGroup
                title="Tomorrow"
                slots={tomorrow}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>

          {!selected && (
            <p className="mt-3 text-xs text-neutral-500">Select a time slot to enable PICK UP.</p>
          )}
        </section>
      )}

      <PickUpButton adId={adId} slot={selected} signedIn={signedIn} disabled={atLimit || (hasSlots && !selected)} />
    </>
  );
}

function SlotGroup({
  title,
  slots,
  selected,
  onSelect,
}: {
  title: string;
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <SlotOption
            key={slot}
            slot={slot}
            label={slot}
            selected={selected === slot}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
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
