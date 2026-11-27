"use client";

import { AddressAutocomplete, type AddressValue } from "@/components/AddressAutocomplete";
import { Continue } from "@/components/wizard/Continue";

export function AddressStep({
  address,
  latitude,
  longitude,
  onChange,
  onContinue,
}: AddressValue & {
  onChange: (next: AddressValue) => void;
  onContinue: () => void;
}) {
  return (
    <div className="px-4 py-6">
      <p className="mb-3 font-semibold text-neutral-800">Enter pick-up address:</p>
      <AddressAutocomplete
        address={address}
        latitude={latitude}
        longitude={longitude}
        onChange={onChange}
      />
      <Continue onClick={onContinue} disabled={address.trim().length < 3} />
    </div>
  );
}
