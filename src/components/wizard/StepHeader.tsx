"use client";

import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function StepHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center border-b border-brand-border px-4 py-4">
      <div className="w-8">
        {onBack && (
          <button onClick={onBack} aria-label="Back">
            <ChevronLeftIcon className="h-6 w-6 text-neutral-700" />
          </button>
        )}
      </div>
      <h1 className="flex-1 text-center text-lg font-medium text-neutral-900">{title}</h1>
      <div className="w-8 text-right">
        {onClose && (
          <button onClick={onClose} aria-label="Close">
            <XMarkIcon className="h-6 w-6 text-neutral-700" />
          </button>
        )}
      </div>
    </div>
  );
}
