"use client";

import { CATEGORIES, CategoryKey } from "@/lib/types";

export function SubCategoryStep({
  category,
  value,
  onSelect,
}: {
  category: CategoryKey;
  value: string | null;
  onSelect: (subCategory: string) => void;
}) {
  const config = CATEGORIES.find((c) => c.key === category)!;

  return (
    <div className="px-4 py-6">
      <p className="mb-4 text-sm text-neutral-500">{config.label}</p>
      <div className="grid grid-cols-2 gap-3">
        {config.subTypes.map((sub) => (
          <button
            key={sub}
            onClick={() => onSelect(sub)}
            className={`rounded-[var(--radius-card)] border p-5 text-center text-sm font-medium ${
              value === sub
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-brand-border text-neutral-700"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
}
