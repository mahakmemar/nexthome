export const CATEGORIES = [
  {
    key: "MOVE_DELIVER",
    label: "Move & deliver",
    subTypes: ["Small moves", "Blocket delivery", "From a store", "Pick up lost items"],
    gradient: "from-blue-500 to-blue-900",
  },
  {
    key: "BUY_FOR_ME",
    label: "Buy for me",
    subTypes: ["Grocery run", "Hardware store", "Pharmacy", "Other purchase"],
    gradient: "from-fuchsia-600 to-indigo-900",
  },
  {
    key: "REMOVE_RECYCLE",
    label: "Remove & recycle",
    subTypes: ["Garden waste", "Furniture", "Electronics", "General junk"],
    gradient: "from-emerald-500 to-teal-800",
  },
  {
    key: "GIVE_AWAY",
    label: "Give away",
    subTypes: ["Furniture", "Clothes", "Electronics", "Other items"],
    gradient: "from-amber-400 to-rose-700",
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const SIZES = [
  { key: "S", label: "S", hint: "Fits in a bag or box" },
  { key: "M", label: "M", hint: "Bike, chair, a few boxes" },
  { key: "L", label: "L", hint: "Sofa, large furniture" },
  { key: "XL", label: "XL", hint: "Needs a van or trailer" },
] as const;

export type SizeKey = (typeof SIZES)[number]["key"];

export function categoryLabel(key: string) {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const SERVICE_FEE_RATE = 0.15;
export const SERVICE_FEE_MIN = 19;

export function calcServiceFee(price: number) {
  return Math.max(SERVICE_FEE_MIN, Math.round(price * SERVICE_FEE_RATE));
}
