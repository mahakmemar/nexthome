"use client";

export function Continue({
  onClick,
  disabled,
  label = "CONTINUE",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[56px] mx-auto max-w-[480px] px-4 pb-3">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-[var(--radius-btn)] bg-brand-blue py-4 text-center text-base font-bold text-white shadow-lg disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}
