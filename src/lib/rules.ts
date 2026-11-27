// Business rules that simulate mode can override (booking limit, auto-release timing).
// Server-only: it reads the simulate state file. Outside simulate mode it returns the defaults.

import { isSimulate, readState } from "@/lib/sim/state";

const HOUR = 60 * 60 * 1000;

export const DEFAULT_RULES = {
  /** The most ads one person can have booked at the same time. */
  maxActiveBookings: 5,
  /** A dated booking is released this long after its slot ENDS if the poster hasn't rated it. */
  releaseAfterSlotEndsMs: 1 * HOUR,
  /** "As soon as possible" bookings are released this long after booking. */
  releaseAsapAfterMs: 24 * HOUR,
  /** "Anytime" (and older undated) bookings are released this long after booking. */
  releaseAnytimeAfterMs: 72 * HOUR,
  /** How long a poster can correct an automatic no-show ("they actually came"). */
  undoWindowMs: 48 * HOUR,
};

export type Rules = typeof DEFAULT_RULES;

export function getRules(): Rules {
  if (!isSimulate()) return DEFAULT_RULES;
  return { ...DEFAULT_RULES, ...readState().rules };
}
