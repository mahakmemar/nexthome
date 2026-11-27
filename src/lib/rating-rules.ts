import { z } from "zod";
import { parseDatedSlot } from "@/lib/slots";

// Pure rating rules: no database access, so client components can import this file.
//
// Posters rate the person who booked their ad (the "buyer") once the pick-up should
// have happened. The ratings add up to a reputation that posters see before they
// hand over an item, so people who don't show up are easy to spot.

export const OUTCOMES = [
  { key: "ON_TIME", label: "Came on time" },
  { key: "LATE", label: "Came late" },
  { key: "NO_SHOW", label: "Didn't show up" },
] as const;

export type OutcomeKey = (typeof OUTCOMES)[number]["key"];

export const MAX_COMMENT_LENGTH = 200;

export const ratingSchema = z
  .object({
    outcome: z.enum(["ON_TIME", "LATE", "NO_SHOW"]),
    stars: z.number().int().min(1, "Choose 1 to 5 stars").max(5, "Choose 1 to 5 stars").optional(),
    comment: z.string().trim().max(MAX_COMMENT_LENGTH, `Keep the comment under ${MAX_COMMENT_LENGTH} characters`).optional(),
  })
  // Someone who showed up gets stars. A no-show doesn't: there is nothing to score.
  .refine((r) => r.outcome === "NO_SHOW" || r.stars !== undefined, {
    message: "Choose a star rating",
    path: ["stars"],
  });

export type RatingInput = z.infer<typeof ratingSchema>;

/**
 * True once the booked time has begun, so it makes sense to say how it went.
 * Flexible ("asap" / "anytime") and legacy undated slots have no clock to check,
 * so those can be rated any time after booking.
 */
export function hasPickupStarted(slot: string | null | undefined, now = new Date()) {
  const dated = slot ? parseDatedSlot(slot) : null;
  if (!dated) return true;
  return new Date(dated.y, dated.mo - 1, dated.d, dated.startHour, 0).getTime() <= now.getTime();
}

export type Reputation = {
  /** Ratings received, including no-shows. */
  total: number;
  onTime: number;
  late: number;
  noShows: number;
  /** Average of the star ratings (no-shows have none), or null if there are none. */
  averageStars: number | null;
};

export function summarize(rows: { outcome: string; stars: number | null }[]): Reputation {
  const starred = rows.filter((r) => r.stars !== null).map((r) => r.stars as number);
  return {
    total: rows.length,
    onTime: rows.filter((r) => r.outcome === "ON_TIME").length,
    late: rows.filter((r) => r.outcome === "LATE").length,
    noShows: rows.filter((r) => r.outcome === "NO_SHOW").length,
    averageStars: starred.length ? starred.reduce((a, b) => a + b, 0) / starred.length : null,
  };
}


/** Short parts for display, e.g. ["4.7 stars", "8 pick-ups", "88% on time", "1 no-show"]. */
export function reputationParts(r: Reputation): string[] {
  if (r.total === 0) return [];
  const parts: string[] = [];
  if (r.averageStars !== null) parts.push(`${r.averageStars.toFixed(1)} stars`);
  parts.push(`${r.total} ${r.total === 1 ? "pick-up" : "pick-ups"}`);
  parts.push(`${Math.round((r.onTime / r.total) * 100)}% on time`);
  if (r.noShows > 0) parts.push(`${r.noShows} ${r.noShows === 1 ? "no-show" : "no-shows"}`);
  return parts;
}
