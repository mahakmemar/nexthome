// Time slots a poster offers and a helper picks from.
//
// A poster offers either ONE flexible option ("asap" or "anytime"), or between
// 1 and MAX_TIME_SLOTS hourly slots. A helper claims an ad by picking exactly
// one of the offered slots.

export const MAX_TIME_SLOTS = 5;

export const FLEXIBLE_SLOTS = ["asap", "anytime"] as const;

export const TODAY_SLOTS = ["21-22", "22-23", "23-00"];
export const TOMORROW_SLOTS = [
  "00-01",
  "01-02",
  "02-03",
  "03-04",
  "04-05",
  "05-06",
  "06-07",
  "07-08",
  "08-09",
];

const HOURLY_SLOTS = [...TODAY_SLOTS, ...TOMORROW_SLOTS];

export function isFlexibleSlot(slot: string) {
  return (FLEXIBLE_SLOTS as readonly string[]).includes(slot);
}

export function isValidSlot(slot: string) {
  return isFlexibleSlot(slot) || HOURLY_SLOTS.includes(slot);
}

/** Parse the JSON string stored on Ad.timeSlots into a clean list. */
export function parseSlots(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Validate the slots a poster is offering. Returns the cleaned list, or an
 * error message. Rules: 1 to MAX_TIME_SLOTS unique, known slots; a flexible
 * option ("asap"/"anytime") cannot be combined with other slots.
 */
export function validateOfferedSlots(
  input: unknown,
): { ok: true; slots: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || !input.every((s) => typeof s === "string")) {
    return { ok: false, error: "timeSlots must be a list of slots" };
  }
  const slots = [...new Set(input as string[])];
  if (slots.length === 0) {
    return { ok: false, error: "Select at least one time slot" };
  }
  if (slots.some((s) => !isValidSlot(s))) {
    return { ok: false, error: "Unknown time slot" };
  }
  if (slots.some(isFlexibleSlot) && slots.length > 1) {
    return {
      ok: false,
      error: "As soon as possible and Anytime can't be combined with other slots",
    };
  }
  if (slots.length > MAX_TIME_SLOTS) {
    return { ok: false, error: `You can offer up to ${MAX_TIME_SLOTS} time slots` };
  }
  return { ok: true, slots };
}

function hourRange(slot: string) {
  const [from, to] = slot.split("-");
  return `${from}:00–${to}:00`;
}

/** Human-readable label, e.g. "Today 21:00–22:00". */
export function slotLabel(slot: string) {
  if (slot === "asap") return "As soon as possible";
  if (slot === "anytime") return "Anytime";
  if (TODAY_SLOTS.includes(slot)) return `Today ${hourRange(slot)}`;
  if (TOMORROW_SLOTS.includes(slot)) return `Tomorrow ${hourRange(slot)}`;
  return slot;
}

/**
 * Sentence for the helper who booked: "You have booked Today 21:00–22:00 to pick
 * up this item." Flexible slots read differently, so they get their own wording.
 */
export function bookedSentence(slot: string | null | undefined) {
  if (slot === "asap") return "You have booked to pick up this item as soon as possible.";
  if (slot === "anytime") return "You have booked to pick up this item at any time.";
  if (slot) return `You have booked ${slotLabel(slot)} to pick up this item.`;
  return "You have booked this item for pick-up.";
}
