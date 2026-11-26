"use client";

import { ShieldCheckIcon } from "@heroicons/react/24/solid";
import { Continue } from "@/components/wizard/Continue";

export function PaymentInfoStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <ShieldCheckIcon className="mb-6 h-20 w-20 text-brand-navy" />
      <h1 className="text-2xl font-bold text-neutral-900">Payment on completion</h1>
      <p className="mt-4 text-neutral-600">
        The agreed payment is reserved on your card when the task starts.
        <br />
        The money is only transferred once you confirm you received the help you requested.
      </p>
      <Continue onClick={onContinue} />
    </div>
  );
}
