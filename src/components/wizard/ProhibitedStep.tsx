"use client";

import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { Continue } from "@/components/wizard/Continue";

export function ProhibitedStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <NoSymbolIcon className="mb-6 h-24 w-24 text-brand-pink" />
      <h1 className="text-2xl font-bold text-neutral-900">Things not allowed by our terms</h1>
      <div className="mt-4 space-y-2 text-left text-neutral-700">
        <p>According to our terms of service, we don&apos;t allow SwapCommunity to be used for:</p>
        <p>- items that can be hazardous or lethal for the helper, such as asbestos</p>
        <p>- illegal items or substances</p>
        <p>- aiding in something that is considered illegal</p>
      </div>
      <Continue onClick={onContinue} label="OK, I UNDERSTAND" />
    </div>
  );
}
