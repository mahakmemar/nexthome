import { db } from "@/lib/db";

/** The most ads one person can have booked to pick up at the same time. */
export const MAX_ACTIVE_BOOKINGS = 5;

/** Ads this user has booked and not yet finished or cancelled. */
export function countActiveBookings(userId: string) {
  return db.ad.count({ where: { status: "CLAIMED", claimedById: userId } });
}

export const BOOKING_LIMIT_MESSAGE = `You can have up to ${MAX_ACTIVE_BOOKINGS} ads booked at a time. Cancel one to book another.`;
