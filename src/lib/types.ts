export const CATEGORIES = [
  {
    key: "GIVE_AWAY",
    selectable: true,
    label: "Give away",
    subTypes: ["Furniture", "Clothes", "Electronics", "Other items"],
    gradient: "from-amber-400 to-rose-700",
  },
  {
    key: "MOVE_DELIVER",
    selectable: false, // hidden from the "What do you need help with?" picker; set to true to bring it back
    label: "Move & deliver",
    subTypes: ["Small moves", "Blocket delivery", "From a store", "Pick up lost items"],
    gradient: "from-blue-500 to-blue-900",
  },
  {
    key: "BUY_FOR_ME",
    selectable: false, // hidden from the "What do you need help with?" picker; set to true to bring it back
    label: "Buy for me",
    subTypes: ["Grocery run", "Hardware store", "Pharmacy", "Other purchase"],
    gradient: "from-fuchsia-600 to-indigo-900",
  },
  {
    key: "REMOVE_RECYCLE",
    selectable: true,
    label: "Remove & recycle",
    subTypes: ["Garden waste", "Furniture", "Electronics", "General junk"],
    gradient: "from-emerald-500 to-teal-800",
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** The categories a poster can choose when posting. Hidden ones still exist: existing ads keep their category and label. */
export const SELECTABLE_CATEGORIES = CATEGORIES.filter((category) => category.selectable);

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

