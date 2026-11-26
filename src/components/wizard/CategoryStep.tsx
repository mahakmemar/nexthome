"use client";

import { CATEGORIES, CategoryKey } from "@/lib/types";
import {
  TruckIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

const ICONS: Record<CategoryKey, typeof TruckIcon> = {
  MOVE_DELIVER: TruckIcon,
  BUY_FOR_ME: ShoppingCartIcon,
  REMOVE_RECYCLE: ArrowPathIcon,
  GIVE_AWAY: GiftIcon,
};

export function CategoryStep({
  value,
  onSelect,
}: {
  value: CategoryKey | null;
  onSelect: (key: CategoryKey) => void;
}) {
  return (
    <div className="space-y-3 px-4 py-6">
      {CATEGORIES.map((category) => {
        const Icon = ICONS[category.key];
        return (
          <button
            key={category.key}
            onClick={() => onSelect(category.key)}
            className={`flex w-full items-center gap-4 overflow-hidden rounded-[var(--radius-card)] border ${
              value === category.key ? "border-brand-navy" : "border-brand-border"
            } bg-white`}
          >
            <span className={`h-full w-2 self-stretch bg-gradient-to-b ${category.gradient}`} />
            <Icon className="h-6 w-6 text-neutral-500" />
            <span className="py-5 text-base font-medium text-neutral-800">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
