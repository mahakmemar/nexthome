// Time slots a poster offers and a helper picks from.
//
// A poster offers either ONE flexible option ("asap" or "anytime"), or between
// 1 and MAX_TIME_SLOTS dated one-hour slots, which can be on different days.
// A helper claims an ad by picking exactly one of the offered slots.
//
// Slot formats stored on Ad.timeSlots (a JSON list of strings):
//   "asap" | "anytime"            flexible
//   "2026-11-27@21-22"            a date and a one-hour slot (local time)
//   "21-22"                       legacy slot with no date: "today" 21-23, "tomorrow" 00-08
//
// Dated slots are read in the server's local time zone, which keeps this simple
// for a single-region app. A multi-region app would store a time zone too.

import { currentTime } from "@/lib/now";

export const MAX_TIME_SLOTS = 5;

/** A poster can offer dates from today up to this many days (today included). */
export const BOOKING_WINDOW_DAYS = 14;

/** Hours a poster can offer on a date: the slot starts between 07:00 and 21:00. */
export const FIRST_START_HOUR = 7;
export const LAST_START_HOUR = 21;

export const FLEXIBLE_SLOTS = ["asap", "anytime"] as const;

// Legacy undated slots (older ads and demo data still use these).
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
const LEGACY_SLOTS = [...TODAY_SLOTS, ...TOMORROW_SLOTS];

const pad = (n: number) => String(n).padStart(2, "0");

// ---------- dates ----------

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The date `days` after `date` (both YYYY-MM-DD). */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return localDateString(new Date(y, m - 1, d + days, 12));
}

export function makeDatedSlot(date: string, startHour: number) {
  return `${date}@${pad(startHour)}-${pad((startHour + 1) % 24)}`;
}

const DATED = /^(\d{4})-(\d{2})-(\d{2})@(\d{2})-(\d{2})$/;

export function parseDatedSlot(slot: string) {
  const m = DATED.exec(slot);
  if (!m) return null;
  const [y, mo, d, start, end] = m.slice(1).map(Number);
  if (start > 23 || end !== (start + 1) % 24) return null;
  // Reject dates that don't exist, such as 2026-02-30.
  const check = new Date(y, mo - 1, d, 12);
  if (check.getFullYear() !== y || check.getMonth() !== mo - 1 || check.getDate() !== d) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, startHour: start, endHour: end, y, mo, d };
}

/** When a dated slot ends (a slot ending at 00 ends at midnight, the next day). */
function slotEnd(slot: string) {
  const p = parseDatedSlot(slot);
  return p ? new Date(p.y, p.mo - 1, p.d, p.startHour + 1, 0) : null;
}

/** True for a dated slot that has already finished. Flexible and legacy slots never expire. */
export function isSlotInPast(slot: string, now = currentTime()) {
  const end = slotEnd(slot);
  return end ? end.getTime() <= now.getTime() : false;
}

// ---------- checks ----------

export function isFlexibleSlot(slot: string) {
  return (FLEXIBLE_SLOTS as readonly string[]).includes(slot);
}

export function isValidSlot(slot: string) {
  return isFlexibleSlot(slot) || LEGACY_SLOTS.includes(slot) || parseDatedSlot(slot) !== null;
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
 * option ("asap"/"anytime") cannot be combined with other slots; dated slots
 * must be in the future and within the booking window.
 */
export function validateOfferedSlots(
  input: unknown,
  now = currentTime(),
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

  const today = localDateString(now);
  const lastDay = addDays(today, BOOKING_WINDOW_DAYS - 1);
  for (const slot of slots) {
    const dated = parseDatedSlot(slot);
    if (!dated) continue;
    if (isSlotInPast(slot, now)) {
      return { ok: false, error: "A time slot you picked has already passed" };
    }
    if (dated.date > lastDay) {
      return { ok: false, error: `Time slots can be at most ${BOOKING_WINDOW_DAYS} days ahead` };
    }
  }
  return { ok: true, slots };
}

// ---------- display ----------

/** "Today", "Tomorrow", or e.g. "Fri 27 Nov". */
export function dayLabel(date: string, now = currentTime()) {
  const today = localDateString(now);
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "21:00–22:00" for a dated or legacy slot. */
export function hoursLabel(slot: string) {
  const dated = parseDatedSlot(slot);
  const [from, to] = dated
    ? [pad(dated.startHour), pad(dated.endHour)]
    : slot.split("-");
  return `${from}:00–${to}:00`;
}

/** Human-readable label, e.g. "Fri 27 Nov 21:00–22:00" or "Today 21:00–22:00". */
export function slotLabel(slot: string, now = currentTime()) {
  if (slot === "asap") return "As soon as possible";
  if (slot === "anytime") return "Anytime";
  const dated = parseDatedSlot(slot);
  if (dated) return `${dayLabel(dated.date, now)} ${hoursLabel(slot)}`;
  if (TODAY_SLOTS.includes(slot)) return `Today ${hoursLabel(slot)}`;
  if (TOMORROW_SLOTS.includes(slot)) return `Tomorrow ${hoursLabel(slot)}`;
  return slot;
}

/** Flexible first, then dated slots in time order, then legacy slots. */
export function sortSlots(slots: string[]) {
  const key = (slot: string) => {
    if (isFlexibleSlot(slot)) return `0-${slot}`;
    const dated = parseDatedSlot(slot);
    if (dated) return `1-${dated.date}-${pad(dated.startHour)}`;
    return `2-${String(LEGACY_SLOTS.indexOf(slot)).padStart(3, "0")}`;
  };
  return [...slots].sort((a, b) => key(a).localeCompare(key(b)));
}

/** Non-flexible slots grouped by day, in time order, for showing as a picker. */
export function groupSlotsByDay(slots: string[], now = currentTime()) {
  const groups: { key: string; title: string; items: { slot: string; label: string }[] }[] = [];
  for (const slot of sortSlots(slots.filter((s) => !isFlexibleSlot(s)))) {
    const dated = parseDatedSlot(slot);
    const key = dated ? dated.date : TODAY_SLOTS.includes(slot) ? "legacy-today" : "legacy-tomorrow";
    const title = dated
      ? dayLabel(dated.date, now)
      : TODAY_SLOTS.includes(slot)
        ? "Today"
        : "Tomorrow";
    let group = groups.find((g) => g.key === key);
    if (!group) groups.push((group = { key, title, items: [] }));
    group.items.push({ slot, label: hoursLabel(slot) });
  }
  return groups;
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
