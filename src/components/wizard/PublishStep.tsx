"use client";

import { useState } from "react";
import { categoryLabel } from "@/lib/types";
import { slotLabel, sortSlots } from "@/lib/slots";
import { formatPrice } from "@/lib/money";
import type { WizardData } from "@/lib/wizard";

export function PublishStep({
  data,
  submitting,
  onPublish,
}: {
  data: WizardData;
  submitting: boolean;
  onPublish: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  const timeSlotLabel =
    data.timeSlots.length === 0
      ? "Not set"
      : data.timeSlots.length === 1
        ? slotLabel(data.timeSlots[0])
        : `${data.timeSlots.length} options: ${sortSlots(data.timeSlots).map((s) => slotLabel(s)).join(", ")}`;

  return (
    <div className="pb-28">
      <div className="border-b border-brand-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-pink">
        Drop-off
      </div>

      <Row label="Category" value={categoryLabel(data.category ?? "")} />
      <Row label="Sub-type" value={data.subCategory ?? "-"} />
      <Row label="Address" value={data.address} />
      <Row label="Placement" value={data.placement} />
      <Row label="Floor" value={data.floor || "-"} />
      <Row label="Fits in the elevator" value={data.fitsInElevator ? "Yes" : "No"} />
      <Row label="Can help carry" value={data.canHelpCarry ? "Yes" : "No"} />
      <Row label="When can the pick-up happen?" value={timeSlotLabel} />

      <div className="border-t border-brand-border" />
      <Row label="Price" value={formatPrice(data.price)} bold />

      <label className="flex items-start gap-3 px-4 py-5 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-5 w-5"
        />
        <span>
          I confirm that what is being picked up:
          <br />- matches the photos and description in the ad
          <br />- does not contain anything toxic or harmful
          <br />- will be available at the time for pick-up
        </span>
      </label>

      <div className="fixed inset-x-0 bottom-[56px] mx-auto max-w-[480px] px-4 pb-3">
        <button
          onClick={onPublish}
          disabled={!confirmed || submitting}
          className="w-full rounded-[var(--radius-btn)] bg-brand-pink py-4 text-center text-base font-bold text-white shadow-lg disabled:opacity-40"
        >
          {submitting ? "PUBLISHING..." : "PUBLISH AD"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-border px-4 py-4">
      <span className="text-neutral-600">{label}</span>
      <span className={`text-right text-neutral-900 ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}
